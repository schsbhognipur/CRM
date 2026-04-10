import { Router } from 'express';
import { 
  getDayBook, 
  getFeeCollectionReport, 
  getOutstandingFees, 
  getExpenseLedger,
  exportReportExcel
} from '../controllers/reportController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'));

router.get('/day-book', getDayBook);
router.get('/fee-collection', getFeeCollectionReport);
router.get('/outstanding-fees', getOutstandingFees);
router.get('/expense-ledger', getExpenseLedger);

router.get('/:type/excel', exportReportExcel);

export default router;
