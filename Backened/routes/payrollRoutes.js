import express from 'express';
import {
  createOrUpdatePayrollRun,
  getPayrollRuns,
  getPayrollRunDetails,
  finalizePayrollRun,
  getPayslip,
  getMyPayslips,
} from '../controllers/payrollController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/run', protect, requireRole('admin', 'hr'), createOrUpdatePayrollRun);
router.get('/runs', protect, requireRole('admin', 'hr'), getPayrollRuns);
router.get('/runs/:id', protect, requireRole('admin', 'hr'), getPayrollRunDetails);
router.patch('/runs/:id/finalize', protect, requireRole('admin'), finalizePayrollRun);

router.get('/payslips/:id', protect, getPayslip);
router.get('/my-payslips', protect, getMyPayslips);

export default router;
