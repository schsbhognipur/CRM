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
  uploadImportStudents,
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
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'), updateStudent);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteStudent);

router.post('/:id/photo', upload.single('photo'), uploadPhoto);
router.post('/import', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), uploadImportStudents);

export default router;
