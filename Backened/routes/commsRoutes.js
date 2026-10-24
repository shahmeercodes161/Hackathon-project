import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAuditLogs,
} from '../controllers/commsController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Announcements
router.get('/announcements', protect, getAnnouncements);
router.post('/announcements', protect, requireRole('admin', 'hr'), createAnnouncement);
router.delete('/announcements/:id', protect, requireRole('admin', 'hr'), deleteAnnouncement);

// Notifications
router.get('/notifications', protect, getNotifications);
router.patch('/notifications/read/:id', protect, markNotificationRead);
router.patch('/notifications/read-all', protect, markAllNotificationsRead);

// Audit Logs (Admin Only)
router.get('/audit-logs', protect, requireRole('admin'), getAuditLogs);

export default router;
