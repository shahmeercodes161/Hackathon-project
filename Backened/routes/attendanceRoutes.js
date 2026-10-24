import express from 'express';
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getDailyBoard,
  getAttendanceHistory,
  requestCorrection,
  reviewCorrection,
} from '../controllers/attendanceController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/today', protect, getTodayStatus);
router.get('/board', protect, getDailyBoard);
router.get('/history', protect, getAttendanceHistory);
router.get('/history/:employeeId', protect, getAttendanceHistory);
router.post('/correction/request', protect, requestCorrection);
router.patch('/correction/review/:id', protect, requireRole('admin', 'hr'), reviewCorrection);

export default router;
