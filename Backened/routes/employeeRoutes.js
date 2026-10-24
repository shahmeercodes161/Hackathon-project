import express from 'express';
import {
  registerEmployee,
  getEmployees,
  getEmployee360,
  updateEmployee,
  dryRunCsvImport,
  commitCsvImport,
  exportEmployeesCsv,
} from '../controllers/employeeController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getEmployees);
router.post('/', protect, requireRole('admin', 'hr'), registerEmployee);
router.get('/:id/360', protect, getEmployee360);
router.put('/:id', protect, updateEmployee);

// CSV
router.post('/csv/dry-run', protect, requireRole('admin', 'hr'), dryRunCsvImport);
router.post('/csv/commit', protect, requireRole('admin', 'hr'), commitCsvImport);
router.get('/export/csv', protect, requireRole('admin', 'hr'), exportEmployeesCsv);

export default router;
