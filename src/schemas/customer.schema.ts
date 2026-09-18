import { z } from 'zod';

export const registerCustomerSchema = z.object({
    body: z.object({
        first_name: z.string().min(1, 'first_name is required'),
        last_name: z.string().min(1, 'last_name is required'),
        email: z.email('Invalid email'),
        phone: z.string().min(1).optional(),
        password: z.string().min(6, 'Password must contain minimum 6 characters')
    })
});

export const loginCustomerSchema = z.object({
    body: z.object({
        email: z.email('Invalid email'),
        password: z.string().min(6, 'Password must contain minimum 6 characters')
    })
});

export const updateCustomerSchema = z.object({
    body: z.object({
        first_name: z.string().min(1).optional(),
        last_name: z.string().min(1).optional(),
        email: z.email('Invalid email').optional(),
        phone: z.string().min(1).optional()
    })
});

export const changePasswordSchema = z.object({
    body: z.object({
        current_password: z.string().min(1, 'current_password is required'),
        new_password: z.string().min(6, 'new_password must contain minimum 6 characters')
    })
});