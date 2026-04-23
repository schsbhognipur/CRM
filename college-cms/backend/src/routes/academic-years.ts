import { Router } from 'express';
import { 
   getAcademicYears, 
   getActiveAcademicYear, 
   createAcademicYear, 
   updateAcademicYear, 
   activateAcademicYear 
} from '../controllers/academicYearController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', getAcademicYears);
router.get('/active', getActiveAcademicYear);

router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createAcademicYear);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateAcademicYear);
router.put('/:id/activate', authorize('SUPER_ADMIN', 'ADMIN'), activateAcademicYear);

export default router;
