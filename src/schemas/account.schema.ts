import { z } from 'zod';

export const createAccountSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required')
    })
});

export const updateAccountSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').optional()
    })
});

export const registerAccountSchema = z.object({
    body: z.object({
        restaurant_name: z.string().min(1, 'restaurant_name is required'),
        first_name: z.string().min(1, 'first_name is required'),
        last_name: z.string().min(1, 'last_name is required'),
        email: z.email('Invalid email'),
        password: z.string().min(6, 'Password must contain minimum 6 characters')
    })
});