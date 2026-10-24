import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  reviewLeave,
  cancelLeave,
} from '../controllers/leaveController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/apply', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/pending', protect, requireRole('admin', 'hr'), getPendingLeaves);
router.patch('/review/:id', protect, requireRole('admin', 'hr'), reviewLeave);
router.patch('/cancel/:id', protect, cancelLeave);

export default router;
