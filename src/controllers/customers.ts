import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../manager/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../errors/AppError';

function excludePassword(customer: any) {
    const { password, ...rest } = customer;
    return rest;
}

export const register = asyncHandler(async (req, res) => {
    const { first_name, last_name, email, phone, password } = req.body;

    const existing = await prisma.customers.findUnique({ where: { email } });
    if (existing) {
        throw new AppError('An account with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await prisma.customers.create({
        data: { first_name, last_name, email, phone, password: hashedPassword }
    });

    const token = jwt.sign(
        { id: customer.id, type: 'customer' },
        process.env.JWT_SECRET as string,
        { expiresIn: '30d' }
    );

    res.status(201).send({ token, customer: excludePassword(customer) });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const customer = await prisma.customers.findUnique({ where: { email } });

    if (!customer || !(await bcrypt.compare(password, customer.password))) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
        { id: customer.id, type: 'customer' },
        process.env.JWT_SECRET as string,
        { expiresIn: '30d' }
    );

    res.status(200).send({ token, customer: excludePassword(customer) });
});

export const getMe = asyncHandler(async (req, res) => {
    const customer = await prisma.customers.findUnique({
        where: { id: req.customer!.id }
    });

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    res.status(200).send(excludePassword(customer));
});

export const updateMe = asyncHandler(async (req, res) => {
    const { first_name, last_name, email, phone } = req.body;

    if (email) {
        const existing = await prisma.customers.findUnique({ where: { email } });
        if (existing && existing.id !== req.customer!.id) {
            throw new AppError('An account with this email already exists', 409);
        }
    }

    const customer = await prisma.customers.update({
        where: { id: req.customer!.id },
        data: { first_name, last_name, email, phone }
    });

    res.status(200).send(excludePassword(customer));
});

export const changePassword = asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body;

    const customer = await prisma.customers.findUnique({
        where: { id: req.customer!.id }
    });

    if (!customer || !(await bcrypt.compare(current_password, customer.password))) {
        throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await prisma.customers.update({
        where: { id: req.customer!.id },
        data: { password: hashedPassword }
    });

    res.status(200).send({ message: 'Password updated successfully' });
});