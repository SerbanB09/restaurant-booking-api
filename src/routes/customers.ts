import { Router } from 'express';
import { register, login, getMe, updateMe, changePassword } from '../controllers/customers';
import { validate } from '../middlewares/validate';
import { authenticateCustomer } from '../middlewares/customerAuth.middleware';
import {
    registerCustomerSchema,
    loginCustomerSchema,
    updateCustomerSchema,
    changePasswordSchema
} from '../schemas/customer.schema';

const router = Router();

router.post('/', validate(registerCustomerSchema), register);
router.post('/login', validate(loginCustomerSchema), login);

router.get('/me', authenticateCustomer, getMe);
router.patch('/me', authenticateCustomer, validate(updateCustomerSchema), updateMe);
router.patch('/me/password', authenticateCustomer, validate(changePasswordSchema), changePassword);

export default router;