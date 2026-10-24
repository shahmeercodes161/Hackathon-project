import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';
import { calculateWorkingDays } from '../services/dateService.js';
import { getMyLeaveBalance } from '../services/aiService.js';
import { logAudit } from '../services/auditService.js';

/**
 * @route   POST /api/leaves/apply
 * @desc    Apply for leave (Skips weekends & holidays; Overlap or Overbalance = 422)
 */
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.role === 'employee' ? req.user.employeeId : req.body.employeeId || req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No associated employee record found' });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, end date, and reason are required',
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    // 1. Calculate working days (skips weekends + holidays)
    const workingDaysCount = await calculateWorkingDays(startDate, endDate);
    if (workingDaysCount <= 0) {
      return res.status(422).json({
        success: false,
        message: 'Selected date range contains 0 working days (falls on weekends or public holidays).',
      });
    }

    // 2. Overlap Check (Status: pending or approved) -> Return 422
    const overlapping = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    });

    if (overlapping) {
      return res.status(422).json({
        success: false,
        message: `Leave overlap error (422): You already have an active leave request from ${overlapping.startDate} to ${overlapping.endDate}.`,
        conflict: overlapping,
      });
    }

    // 3. Balance Check (Quotas: annual 14, sick 8, casual 10, unpaid unlimited) -> Return 422
    const balanceInfo = await getMyLeaveBalance({}, { employeeId });
    const currentYear = new Date().getFullYear();

    if (leaveType !== 'Unpaid' && balanceInfo.balances && balanceInfo.balances[leaveType]) {
      const typeBalance = balanceInfo.balances[leaveType];
      if (workingDaysCount > typeBalance.remaining) {
        return res.status(422).json({
          success: false,
          message: `Over-balance error (422): Requested ${workingDaysCount} day(s), but only ${typeBalance.remaining} ${leaveType} leave day(s) remain for ${currentYear}.`,
          balance: typeBalance,
        });
      }
    }

    // 4. Create Leave Request
    const leave = await LeaveRequest.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      workingDaysCount,
      reason,
      status: 'pending',
    });

    const emp = await Employee.findById(employeeId).select('fullName employeeCode');

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'Leave',
      entityId: leave._id,
      description: `Leave applied by ${emp?.fullName || employeeId}: ${workingDaysCount} day(s) of ${leaveType} leave`,
    });

    res.status(201).json({
      success: true,
      message: `Leave request for ${workingDaysCount} working day(s) submitted successfully.`,
      leave,
    });
  } catch (error) {
    console.error('Apply Leave Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/leaves/my
 * @desc    Get personal leaves and balance
 */
export const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.json({ success: true, leaves: [], balances: {} });
    }

    const leaves = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 }).lean();
    const balanceData = await getMyLeaveBalance({}, { employeeId });

    res.json({
      success: true,
      leaves,
      balances: balanceData.balances,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/leaves/pending
 * @desc    HR inbox for pending leaves
 */
export const getPendingLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ status: 'pending' })
      .populate('employeeId', 'employeeCode fullName department designation')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PATCH /api/leaves/review/:id
 * @desc    HR approves or rejects a leave request with a comment
 */
export const reviewLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, hrComment } = req.body; // action: 'approve' | 'reject'

    const leave = await LeaveRequest.findById(id).populate('employeeId', 'fullName email userId');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: `This leave request is already ${leave.status}` });
    }

    const before = leave.toObject();

    leave.status = action === 'approve' ? 'approved' : 'rejected';
    leave.hrComment = hrComment || (action === 'approve' ? 'Approved by HR' : 'Rejected by HR');
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    // Create Notification for the employee
    if (leave.employeeId?.userId) {
      await Notification.create({
        userId: leave.employeeId.userId,
        title: `Leave Request ${leave.status.toUpperCase()}`,
        message: `Your ${leave.leaveType} leave request for ${leave.startDate} to ${leave.endDate} has been ${leave.status}. Comment: "${leave.hrComment}"`,
        type: 'leave',
      });
    }

    await logAudit({
      req,
      action: action === 'approve' ? 'APPROVE' : 'REJECT',
      entity: 'Leave',
      entityId: leave._id,
      description: `HR ${action}d ${leave.leaveType} leave for ${leave.employeeId?.fullName}: ${leave.hrComment}`,
      before,
      after: leave,
    });

    res.json({
      success: true,
      message: `Leave request ${leave.status} successfully`,
      leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PATCH /api/leaves/cancel/:id
 * @desc    Employee cancels own pending leave
 */
export const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRequest.findById(id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    if (req.user.role === 'employee' && String(leave.employeeId) !== String(req.user.employeeId)) {
      return res.status(403).json({ success: false, message: 'Cannot cancel another employee\'s leave' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending leave requests can be cancelled' });
    }

    leave.status = 'cancelled';
    await leave.save();

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'Leave',
      entityId: leave._id,
      description: `Leave request cancelled by user`,
    });

    res.json({ success: true, message: 'Leave request cancelled successfully', leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
