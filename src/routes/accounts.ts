import { Router } from 'express';
import { findMany, getOne, updateOne, deleteOne, createOne, registerAccount } from '../controllers/accounts';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth.middleware';
import { createAccountSchema, updateAccountSchema, registerAccountSchema } from '../schemas/account.schema';

const router = Router();

router.post('/register', validate(registerAccountSchema), registerAccount);
router.post('/', validate(createAccountSchema), createOne);
router.get('/', authenticate, findMany);
router.get('/:id', authenticate, getOne);
router.patch('/:id', authenticate, validate(updateAccountSchema), updateOne);
router.delete('/:id', authenticate, deleteOne);

export default router;