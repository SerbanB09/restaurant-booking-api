`use strict`

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/users';
import accountRoutes from './routes/accounts';
import venueRoutes from './routes/venues';
import tableTypeRoutes from './routes/table_types';
import areaRoutes from './routes/areas';
import tableRoutes from './routes/tables';
import bookingRoutes from './routes/bookings';
import { errorHandler } from './middlewares/errorHandler';
import publicRoutes from './routes/public';
import customerRoutes from './routes/customers';

dotenv.config();

const app = express()

app.use(cors());

app.use(express.json());

app.use('/users', userRoutes);
app.use('/accounts', accountRoutes);
app.use('/venues', venueRoutes);
app.use('/table_types', tableTypeRoutes);
app.use('/areas', areaRoutes);
app.use('/tables', tableRoutes);
app.use('/bookings', bookingRoutes);
app.use('/public', publicRoutes);
app.use('/customers', customerRoutes);

app.use(errorHandler);

export default app;