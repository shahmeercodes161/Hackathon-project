import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { logAudit } from '../services/auditService.js';

// --- Announcements ---
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(20).lean();
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority = 'normal' } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const ann = await Announcement.create({
      title,
      content,
      priority,
      postedBy: req.user.name,
      postedByRole: req.user.role,
    });

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'Company',
      entityId: ann._id,
      description: `Posted announcement: "${title}" (${priority})`,
      after: ann,
    });

    res.status(201).json({ success: true, message: 'Announcement posted', announcement: ann });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: 'Announcement not found' });

    await logAudit({
      req,
      action: 'DELETE',
      entity: 'Company',
      entityId: ann._id,
      description: `Deleted announcement: "${ann.title}"`,
    });

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Notifications ---
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate({ _id: id, userId: req.user._id }, { isRead: true });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { isRead: true });
    res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Audit Logs (Admin Only) ---
export const getAuditLogs = async (req, res) => {
  try {
    const { entity, action, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (entity && entity !== 'All') filter.entity = entity;
    if (action && action !== 'All') filter.action = action;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
