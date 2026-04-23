import { Router } from 'express';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  toggleActive, 
  resetPassword, 
  deleteUser 
} from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// Protected by SUPER_ADMIN or ADMIN
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getUsers);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createUser);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateUser);
router.put('/:id/toggle-active', authorize('SUPER_ADMIN', 'ADMIN'), toggleActive);

// Protected by SUPER_ADMIN only
router.put('/:id/reset-password', authorize('SUPER_ADMIN'), resetPassword);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteUser);

export default router;
