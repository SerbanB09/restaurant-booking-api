import express from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            customer?: { id: string };
        }
    }
}

export async function authenticateCustomer(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).send({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        if (decoded.type !== 'customer') {
            res.status(401).send({ error: 'Invalid token' });
            return;
        }

        req.customer = { id: decoded.id };
        next();
    } catch (e) {
        res.status(401).send({ error: 'Invalid token' });
    }
}

export async function optionalCustomerAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        next();
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        if (decoded.type !== 'customer') {
            res.status(401).send({ error: 'Invalid token' });
            return;
        }

        req.customer = { id: decoded.id };
        next();
    } catch (e) {
        res.status(401).send({ error: 'Invalid token' });
    }
}