import {prisma} from "../manager/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../errors/AppError";

const BOOKING_DURATION_MS = 2 * 60 * 60 * 1000;

async function getAccountVenueIds(account_id: string): Promise<string[]> {
    const venues = await prisma.venues.findMany({
        where: { account_id },
        select: { id: true }
    });
    return venues.map(v => v.id);
}

async function getAccountAreaIds(account_id: string): Promise<string[]> {
    const venueIds = await getAccountVenueIds(account_id);

    const areas = await prisma.areas.findMany({
        where: { venue_id: { in: venueIds } },
        select: { id: true }
    });

    return areas.map(a => a.id);
}

async function hasConflict(table_id: string, date: Date, excludeBookingId?: string): Promise<boolean> {
    const windowStart = new Date(date.getTime() - BOOKING_DURATION_MS);
    const windowEnd = new Date(date.getTime() + BOOKING_DURATION_MS);

    const overlapping = await prisma.bookings.findMany({
        where: {
            table_id,
            date: { gte: windowStart, lte: windowEnd },
            ...(excludeBookingId ? { id: { not: excludeBookingId } } : {})
        }
    });

    return overlapping.length > 0;
}

export const findMany = asyncHandler(async (req, res) => {
    const venueIds = await getAccountVenueIds(req.user.account_id);

    const bookings = await prisma.bookings.findMany({
        where: { venue_id: { in: venueIds } },
        orderBy: { date: 'asc' }
    });

    res.status(200).send(bookings);
});

export const getOne = asyncHandler(async (req, res) => {
    const venueIds = await getAccountVenueIds(req.user.account_id);

    const booking = await prisma.bookings.findUnique({
        where: { id: req.params.id }
    });

    if (!booking || !venueIds.includes(booking.venue_id)) {
        throw new AppError('Booking not found', 404);
    }

    res.send(booking);
});

export const updateOne = asyncHandler(async (req, res) => {
    const { user_id, customer_id, ...data } = req.body;

    const venueIds = await getAccountVenueIds(req.user.account_id);

    const existing = await prisma.bookings.findUnique({
        where: { id: req.params.id }
    });

    if (!existing || !venueIds.includes(existing.venue_id)) {
        throw new AppError('Booking not found', 404);
    }

    const table_id = data.table_id ?? existing.table_id;
    const date = data.date ? new Date(data.date) : existing.date;

    if (data.table_id || data.date) {
        const conflict = await hasConflict(table_id, date, existing.id);
        if (conflict) {
            throw new AppError('Table already booked around this time', 409);
        }
    }

    const booking = await prisma.bookings.update({
        where: { id: req.params.id },
        data
    });

    res.status(200).send(booking);
});

export const deleteOne = asyncHandler(async (req, res) => {
    const venueIds = await getAccountVenueIds(req.user.account_id);

    const existing = await prisma.bookings.findUnique({
        where: { id: req.params.id }
    });

    if (!existing || !venueIds.includes(existing.venue_id)) {
        throw new AppError('Booking not found', 404);
    }

    await prisma.bookings.delete({
        where: { id: req.params.id }
    });

    res.status(204).send();
});

export const createOne = asyncHandler(async (req, res) => {
    const { user_id, customer_id, ...rest_of_data } = req.body;

    const areaIds = await getAccountAreaIds(req.user.account_id);

    const table = await prisma.tables.findUnique({
        where: { id: rest_of_data.table_id }
    });

    if (!table || !areaIds.includes(table.area_id)) {
        throw new AppError('Invalid table_id', 400);
    }

    const date = new Date(rest_of_data.date);

    const conflict = await hasConflict(rest_of_data.table_id, date);
    if (conflict) {
        throw new AppError('Table already booked around this time', 409);
    }

    const booking = await prisma.bookings.create({
        data: {
            ...rest_of_data,
            date,
            user_id: req.user.id
        }
    });

    res.status(201).send(booking);
});