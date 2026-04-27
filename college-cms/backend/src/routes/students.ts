import { Router } from 'express';
import multer from 'multer';
import { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  uploadPhoto,
  exportStudents,
  importStudents,
  importStudentFees,
  searchStudents,
  syncStudentFee
} from '../controllers/studentController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/', getStudents);
router.get('/export', exportStudents);
router.get('/search', searchStudents);
router.get('/:id', getStudent);

router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createStudent);
router.post('/:id/sync-fee', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), syncStudentFee);
router.post('/import', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), importStudents);
router.post('/import-fees', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), upload.single('file'), importStudentFees);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'), updateStudent);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteStudent);

export default router;
