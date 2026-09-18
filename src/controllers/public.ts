import { prisma } from "../manager/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../errors/AppError";

const BOOKING_DURATION_MS = 2 * 60 * 60 * 1000;

async function hasConflict(table_id: string, date: Date): Promise<boolean> {
    const windowStart = new Date(date.getTime() - BOOKING_DURATION_MS);
    const windowEnd = new Date(date.getTime() + BOOKING_DURATION_MS);

    const overlapping = await prisma.bookings.findMany({
        where: {
            table_id,
            date: { gte: windowStart, lte: windowEnd }
        }
    });

    return overlapping.length > 0;
}

export const getVenue = asyncHandler(async (req, res) => {
    const venue = await prisma.venues.findUnique({
        where: { id: req.params.venueId }
    });

    if (!venue) {
        throw new AppError('Venue not found', 404);
    }

    res.status(200).send({
        id: venue.id,
        name: venue.name,
        address: venue.address
    });
});

export const listVenues = asyncHandler(async (req, res) => {
    const venues = await prisma.venues.findMany({
        select: { id: true, name: true, address: true }
    });

    res.status(200).send(venues);
});

export const createBooking = asyncHandler(async (req, res) => {
    let { guest_name, guest_phone, person_count, date } = req.body;

    const venue = await prisma.venues.findUnique({
        where: { id: req.params.venueId }
    });

    if (!venue) {
        throw new AppError('Venue not found', 404);
    }

    let customer_id: string | undefined = undefined;

    if (req.customer) {
        const customer = await prisma.customers.findUnique({
            where: { id: req.customer.id }
        });

        if (!customer) {
            throw new AppError('Customer not found', 404);
        }

        customer_id = customer.id;
        guest_name = `${customer.first_name} ${customer.last_name}`;
        guest_phone = customer.phone ?? guest_phone;
    } else {
        if (!guest_name || !guest_phone) {
            throw new AppError('guest_name and guest_phone are required', 400);
        }
    }

    const areas = await prisma.areas.findMany({
        where: { venue_id: venue.id },
        select: { id: true }
    });
    const areaIds = areas.map(a => a.id);

    const candidateTables = await prisma.tables.findMany({
        where: {
            area_id: { in: areaIds },
            seat_count: { gte: person_count }
        },
        orderBy: { seat_count: 'asc' }
    });

    if (candidateTables.length === 0) {
        throw new AppError('No table large enough for that party size', 409);
    }

    const bookingDate = new Date(date);

    let chosenTable = null;
    for (const table of candidateTables) {
        const conflict = await hasConflict(table.id, bookingDate);
        if (!conflict) {
            chosenTable = table;
            break;
        }
    }

    if (!chosenTable) {
        throw new AppError('No tables available at that time', 409);
    }

    const booking = await prisma.bookings.create({
        data: {
            venue_id: venue.id,
            table_id: chosenTable.id,
            person_count,
            date: bookingDate,
            guest_name,
            guest_phone,
            customer_id
        }
    });

    res.status(201).send({
        id: booking.id,
        venue_id: booking.venue_id,
        person_count: booking.person_count,
        date: booking.date,
        guest_name: booking.guest_name
    });
});