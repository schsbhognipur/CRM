import { Router } from 'express';
import { 
  getDashboardSummary, 
  getMonthlyChartData, 
  getActivityFeed 
} from '../controllers/dashboardController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/monthly-chart', getMonthlyChartData);
router.get('/activity-feed', getActivityFeed);

export default router;
