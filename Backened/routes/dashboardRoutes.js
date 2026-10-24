import express from 'express';
import {
  getAdminDashboard,
  getHrDashboard,
  getEmployeeDashboard,
} from '../controllers/dashboardController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, requireRole('admin'), getAdminDashboard);
router.get('/hr', protect, requireRole('admin', 'hr'), getHrDashboard);
router.get('/employee', protect, getEmployeeDashboard);

export default router;
