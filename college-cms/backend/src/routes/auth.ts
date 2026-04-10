import { Router } from 'express';
import { login, refresh, logout, me } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
