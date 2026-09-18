import {prisma} from "../manager/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../errors/AppError";
import express from "express";

async function getOwnedVenueIds(account_id: string): Promise<string[]> {
    const venues = await prisma.venues.findMany({
        where: { account_id },
        select: { id: true }
    });
    return venues.map(v => v.id);
}

const findMany = asyncHandler(async (req, res) => {
    const venueIds = await getOwnedVenueIds(req.user.account_id);

    const areas = await prisma.areas.findMany({
        where: { venue_id: { in: venueIds } }
    });

    res.status(200).send(areas);
});

const getOne = asyncHandler(async (req, res) => {
    const area = await prisma.areas.findUnique({
        where: { id: req.params.id }
    });

    if (!area) {
        throw new AppError('Area not found', 404);
    }

    const venue = await prisma.venues.findUnique({
        where: { id: area.venue_id, account_id: req.user.account_id }
    });

    if (!venue) {
        throw new AppError('Area not found', 404);
    }

    res.send(area);
});

const updateOne = asyncHandler(async (req, res) => {
    const { venue_id, ...data } = req.body;

    const existing = await prisma.areas.findUnique({
        where: { id: req.params.id }
    });

    if (!existing) {
        throw new AppError('Area not found', 404);
    }

    const venue = await prisma.venues.findUnique({
        where: { id: existing.venue_id, account_id: req.user.account_id }
    });

    if (!venue) {
        throw new AppError('Area not found', 404);
    }

    const area = await prisma.areas.update({
        where: { id: req.params.id },
        data
    });

    res.status(200).send(area);
});

const deleteOne = asyncHandler(async (req, res) => {
    const existing = await prisma.areas.findUnique({
        where: { id: req.params.id }
    });

    if (!existing) {
        throw new AppError('Area not found', 404);
    }

    const venue = await prisma.venues.findUnique({
        where: { id: existing.venue_id, account_id: req.user.account_id }
    });

    if (!venue) {
        throw new AppError('Area not found', 404);
    }

    await prisma.areas.delete({
        where: { id: req.params.id }
    });

    res.status(204).send();
});

const createOne = asyncHandler(async (req, res) => {
    const { venue_id, ...data } = req.body;

    const venue = await prisma.venues.findUnique({
        where: { id: venue_id, account_id: req.user.account_id }
    });

    if (!venue) {
        throw new AppError('Invalid venue_id', 400);
    }

    const area = await prisma.areas.create({
        data: { ...data, venue_id }
    });

    res.status(201).send(area);
});

const BOOKING_DURATION_MS = 2 * 60 * 60 * 1000;

async function getFloorPlan(req: express.Request, res: express.Response) {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
        res.status(400).send({ error: 'date query param is required' });
        return;
    }

    const area = await prisma.areas.findUnique({
        where: { id: req.params.id }
    });

    if (!area) {
        res.status(404).send({ error: 'Area not found' });
        return;
    }

    const venue = await prisma.venues.findUnique({
        where: { id: area.venue_id, account_id: req.user.account_id }
    });

    if (!venue) {
        res.status(404).send({ error: 'Area not found' });
        return;
    }

    const tables = await prisma.tables.findMany({
        where: { area_id: area.id }
    });

    const requestedDate = new Date(date);
    const windowStart = new Date(requestedDate.getTime() - BOOKING_DURATION_MS);

    const tableIds = tables.map(t => t.id);
    const bookings = await prisma.bookings.findMany({
        where: {
            table_id: { in: tableIds },
            date: { gte: windowStart, lte: requestedDate }
        }
    });

    const bookingByTable = new Map(bookings.map(b => [b.table_id, b]));

    const tablesWithStatus = tables.map(table => ({
        id: table.id,
        name: table.name,
        seat_count: table.seat_count,
        position_x: table.position_x,
        position_y: table.position_y,
        booking: bookingByTable.get(table.id) ?? null
    }));

    res.status(200).send({
        area: { id: area.id, name: area.name, width: area.width, height: area.height },
        tables: tablesWithStatus
    });
}

export {findMany, getOne, deleteOne, createOne, updateOne, getFloorPlan}