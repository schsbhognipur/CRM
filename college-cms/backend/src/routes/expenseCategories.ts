import { Router } from 'express';
import { 
  getExpenseCategories, 
  createExpenseCategory, 
  updateExpenseCategory 
} from '../controllers/expenseCategoryController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', getExpenseCategories);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), createExpenseCategory);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), updateExpenseCategory);

export default router;
