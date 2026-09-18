import { prisma } from "../manager/prisma";
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../errors/AppError';
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

function excludePassword<User extends { password?: string }>(user: User) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

function isAdmin(req: express.Request) {
    return Array.isArray(req.user?.roles) && req.user.roles.includes('admin');
}

export const findMany = asyncHandler(async (req, res) => {
    const users = await prisma.users.findMany({
        where: { account_id: req.user.account_id }
    });

    res.status(200).send(users.map(excludePassword));
});

export const getOne = asyncHandler(async (req, res) => {
    const user = await prisma.users.findUnique({
        where: { id: req.params.id, account_id: req.user.account_id }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json(excludePassword(user));
});

export const updateOne = asyncHandler(async (req, res) => {
    if (!isAdmin(req) && req.params.id !== req.user.id) {
        throw new AppError('Forbidden', 403);
    }

    const existingUser = await prisma.users.findUnique({
        where: { id: req.params.id, account_id: req.user.account_id }
    });

    if (!existingUser) {
        throw new AppError('User not found', 404);
    }

    // account_id, is_owner and roles can never be set by the client directly;
    // roles may only be changed by an admin, handled explicitly below, and
    // never for the account owner.
    let { password, account_id, roles, is_owner, ...data } = req.body;

    if (password) {
        data.password = await bcrypt.hash(password, 10);
    }

    if (roles && isAdmin(req)) {
        if (existingUser.is_owner) {
            throw new AppError("The account owner's role cannot be changed", 403);
        }
        data.roles = roles;
    }

    const user = await prisma.users.update({
        where: { id: req.params.id, account_id: req.user.account_id },
        data
    }).catch(() => null);

    if (!user) {
        throw new AppError('User not found or update failed', 404);
    }

    res.status(200).send(excludePassword(user));
});

export const deleteOne = asyncHandler(async (req, res) => {
    if (!isAdmin(req)) {
        throw new AppError('Only admins can remove staff members', 403);
    }

    if (req.params.id === req.user.id) {
        throw new AppError('You cannot remove your own account', 400);
    }

    const existingUser = await prisma.users.findUnique({
        where: { id: req.params.id, account_id: req.user.account_id }
    });

    if (!existingUser) {
        throw new AppError('User not found', 404);
    }

    if (existingUser.is_owner) {
        throw new AppError('The account owner cannot be removed', 403);
    }

    await prisma.users.delete({
        where: { id: req.params.id }
    });

    res.status(204).send();
});

export const createOne = asyncHandler(async (req, res) => {
    if (!isAdmin(req)) {
        throw new AppError('Only admins can add staff members', 403);
    }

    const { password, roles, account_id, ...rest_of_data } = req.body;

    if (!password || typeof password !== 'string') {
        throw new AppError('Password is required', 400);
    }

    const hashed_password = await bcrypt.hash(password, 10);

    const allowedRoles = Array.isArray(roles) && roles.length > 0 ? roles : ['member'];

    const user = await prisma.users.create({
        data: {
            ...rest_of_data,
            account_id: req.user.account_id,
            roles: allowedRoles,
            password: hashed_password
        }
    }).catch((err) => {
        console.error('CREATE USER FAILED:', err);
        return null;
    });

    if (!user) {
        throw new AppError('Could not create user', 400);
    }

    res.status(201).send(excludePassword(user));
});

export const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    const user = await prisma.users.findUnique({
        where: {
            email: email
        }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
        { id: user.id, account_id: user.account_id, roles: user.roles, type: 'staff' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
    );

    res.status(200).send({ token, user: excludePassword(user) });
});
