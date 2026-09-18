import {prisma} from "../manager/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../errors/AppError";
import express from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const findMany = asyncHandler(async (req, res) => {
    const account = await prisma.accounts.findUnique({
        where: { id: req.user.account_id }
    });

    res.status(200).send(account ? [account] : []);
});

export const getOne = asyncHandler(async (req, res) => {
    if (req.params.id !== req.user.account_id) {
        throw new AppError("Forbidden", 403);
    }

    const account = await prisma.accounts.findUnique({
        where: { id: req.params.id }
    });

    if (!account) {
        throw new AppError("Account not found", 404);
    }

    res.send(account);
});

export const updateOne = asyncHandler(async (req, res) => {
    if (req.params.id !== req.user.account_id) {
        throw new AppError("Forbidden", 403);
    }

    const { id, ...data } = req.body;

    const account = await prisma.accounts.update({
        where: { id: req.params.id },
        data
    });

    res.status(200).send(account);
});

export const deleteOne = asyncHandler(async (req, res) => {
    if (req.params.id !== req.user.account_id) {
        throw new AppError("Forbidden", 403);
    }

    await prisma.accounts.delete({
        where: { id: req.params.id }
    });

    res.status(204).send();
});

export const createOne = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
        throw new AppError("Account name is required", 400);
    }

    const account = await prisma.accounts.create({
        data: { name }
    });

    res.status(201).send(account);
});

export const registerAccount = asyncHandler(async (req, res) => {
    const { restaurant_name, first_name, last_name, email, password } = req.body;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
        throw new AppError('An account with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
        const account = await tx.accounts.create({
            data: { name: restaurant_name }
        });

        const user = await tx.users.create({
            data: {
                account_id: account.id,
                first_name,
                last_name,
                email,
                password: hashedPassword,
                roles: ['admin', 'member'],
                is_owner: true
            }
        });

        return { account, user };
    });

    const token = jwt.sign(
        { id: result.user.id, account_id: result.account.id, roles: result.user.roles, type: 'staff' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
    );

    const { password: _pw, ...userWithoutPassword } = result.user;

    res.status(201).send({ token, account: result.account, user: userWithoutPassword });
});
