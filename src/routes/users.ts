import { Router } from 'express';
import { findMany, getOne, deleteOne, createOne, updateOne, login } from '../controllers/users';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth.middleware';
import { loginSchema, createUserSchema, updateUserSchema } from '../schemas/user.schema';

const router = Router();

router.post('/login', validate(loginSchema), login);

router.use(authenticate);

router.post('/', validate(createUserSchema), createOne);
router.get('/', findMany);
router.get('/:id', getOne);
router.put('/:id', validate(updateUserSchema), updateOne);
router.delete('/:id', deleteOne);

export default router;