import { Router } from 'express';
import { 
  getFeeComponents, 
  createFeeComponent, 
  updateFeeComponent 
} from '../controllers/feeComponentController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', getFeeComponents);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createFeeComponent);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateFeeComponent);

export default router;
