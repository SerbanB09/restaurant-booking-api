import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.email('Invalid email'),
        password: z.string().min(6, 'Password must contain minimum 6 characters')
    })
});

export const createUserSchema = z.object({
    body: z.object({
        first_name: z.string().min(1, 'first_name is required'),
        last_name: z.string().min(1, 'last_name is required'),
        email: z.email('Invalid email'),
        password: z.string().min(6, 'Password must contain minimum 6 characters'),
        roles: z.array(z.enum(['admin', 'member'])).optional()
    })
});

export const updateUserSchema = z.object({
    body: z.object({
        first_name: z.string().min(1).optional(),
        last_name: z.string().min(1).optional(),
        email: z.email('Invalid email').optional(),
        password: z.string().min(6, 'Password must contain minimum 6 characters').optional()
    })
});