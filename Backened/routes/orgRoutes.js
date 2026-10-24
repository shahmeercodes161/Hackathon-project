import express from 'express';
import {
  getOrgSettings,
  updateOrgSettings,
  getDepartments,
  createDepartment,
  deleteDepartment,
  getDesignations,
  createDesignation,
  getLeaveTypes,
  createLeaveType,
  getHolidays,
  createHoliday,
  deleteHoliday,
} from '../controllers/orgController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Settings
router.get('/settings', protect, getOrgSettings);
router.put('/settings', protect, requireRole('admin'), updateOrgSettings);

// Departments
router.get('/departments', protect, getDepartments);
router.post('/departments', protect, requireRole('admin'), createDepartment);
router.delete('/departments/:id', protect, requireRole('admin'), deleteDepartment);

// Designations
router.get('/designations', protect, getDesignations);
router.post('/designations', protect, requireRole('admin'), createDesignation);

// Leave Types
router.get('/leave-types', protect, getLeaveTypes);
router.post('/leave-types', protect, requireRole('admin'), createLeaveType);

// Holidays
router.get('/holidays', protect, getHolidays);
router.post('/holidays', protect, requireRole('admin'), createHoliday);
router.delete('/holidays/:id', protect, requireRole('admin'), deleteHoliday);

export default router;
