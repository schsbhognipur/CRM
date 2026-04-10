import { Router } from 'express';
import { 
  getAcademicYears, 
  createAcademicYear, 
  activateAcademicYear, 
  getActiveYear 
} from '../controllers/academicYearController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', getAcademicYears);
router.get('/active', getActiveYear);

router.post('/', authorize('SUPER_ADMIN'), createAcademicYear);
router.put('/:id/activate', authorize('SUPER_ADMIN'), activateAcademicYear);

export default router;
