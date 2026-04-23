import { Router } from 'express';
import { 
   getFeeStructures, 
   createFeeStructure, 
   updateFeeStructure,
   copyFeeStructure,
   deleteFeeStructure
} from '../controllers/feeStructureController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', getFeeStructures);

router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createFeeStructure);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateFeeStructure);
router.post('/:id/copy', authorize('SUPER_ADMIN', 'ADMIN'), copyFeeStructure);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteFeeStructure);

export default router;
