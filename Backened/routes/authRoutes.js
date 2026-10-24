import express from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
  createHrUser,
  listUsers,
  resetUserPassword,
  toggleUserStatus,
} from '../controllers/authController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

// Admin-only user management
router.post('/create-hr', protect, requireRole('admin'), createHrUser);
router.get('/users', protect, requireRole('admin'), listUsers);
router.post('/reset-password', protect, requireRole('admin'), resetUserPassword);
router.patch('/toggle-status/:id', protect, requireRole('admin'), toggleUserStatus);

export default router;
