import { Router } from 'express';
import { 
  getTransactions, 
  recordFeePayment, 
  generateReceiptPDF,
  recordExpense,
  getExpenseSummary,
  updateExpense,
  deleteExpense,
  generateVoucherPDF
} from '../controllers/transactionController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', getTransactions);
router.get('/expense-summary', getExpenseSummary);
router.get('/:id/receipt-pdf', generateReceiptPDF);
router.get('/:id/voucher-pdf', generateVoucherPDF);

router.post('/fee-payment', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), recordFeePayment);
router.post('/expense', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), recordExpense);

router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), updateExpense);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteExpense);

export default router;
