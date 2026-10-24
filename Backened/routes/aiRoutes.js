import express from 'express';
import { askAssistant, dashboardSummary, smartLeaveParse } from '../controllers/aiController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', protect, askAssistant);
router.post('/summarize', protect, requireRole('admin', 'hr'), dashboardSummary);
router.post('/smart-leave', protect, smartLeaveParse);

export default router;
