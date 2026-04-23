import { Router } from 'express';
import { 
  getStudentFees, 
  getDefaulters, 
  waiveFee,
  getStudentFeesByStudent
} from '../controllers/studentFeeController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', getStudentFees);
router.get('/defaulters', getDefaulters);
router.get('/by-student/:studentId', getStudentFeesByStudent);
router.put('/:id/waive', authorize('SUPER_ADMIN', 'ADMIN'), waiveFee);

export default router;
