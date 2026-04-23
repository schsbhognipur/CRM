import { Router } from 'express';
import { getCourses } from '../controllers/courseController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/', getCourses);

export default router;
