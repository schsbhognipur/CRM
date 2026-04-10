import { Router } from 'express';
import { 
  getStudentFees, 
  getDefaulters, 
  waiveFee 
} from '../controllers/studentFeeController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', getStudentFees);
router.get('/defaulters', getDefaulters);
router.put('/:id/waive', authorize('SUPER_ADMIN', 'ADMIN'), waiveFee);

export default router;
