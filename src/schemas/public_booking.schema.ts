import { z } from 'zod';

export const createBookingSchema = z.object({
    body: z.object({
        guest_name: z.string().min(1).optional(),
        guest_phone: z.string().min(1).optional(),
        person_count: z.number().int().positive('person_count must be a positive integer'),
        date: z.iso.datetime('date must be a valid ISO datetime string')
    })
});