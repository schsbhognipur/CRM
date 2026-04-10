import { Router } from 'express';
import { 
  getExpenseCategories, 
  createExpenseCategory, 
  updateExpenseCategory, 
  toggleExpenseCategory 
} from '../controllers/expenseCategoryController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', getExpenseCategories);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createExpenseCategory);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateExpenseCategory);
router.patch('/:id/toggle', authorize('SUPER_ADMIN', 'ADMIN'), toggleExpenseCategory);

export default router;
