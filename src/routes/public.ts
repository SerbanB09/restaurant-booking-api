import { Router } from 'express';
import { getVenue, listVenues, createBooking } from '../controllers/public';
import { validate } from '../middlewares/validate';
import { optionalCustomerAuth } from '../middlewares/customerAuth.middleware';
import { createBookingSchema } from '../schemas/public_booking.schema';

const router = Router();

router.get('/venues', listVenues);
router.get('/venues/:venueId', getVenue);
router.post('/venues/:venueId/bookings', optionalCustomerAuth, validate(createBookingSchema), createBooking);

export default router;