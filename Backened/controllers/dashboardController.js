import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import PayrollRun from '../models/PayrollRun.js';
import Payslip from '../models/Payslip.js';
import AuditLog from '../models/AuditLog.js';
import Announcement from '../models/Announcement.js';
import { getMyLeaveBalance } from '../services/aiService.js';

/**
 * @route   GET /api/dashboards/admin
 * @desc    Admin metrics: Headcount, Attrition YTD, Payroll Cost, Avg Salary, charts, audit feed
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const { department, month } = req.query;

    const empFilter = { status: { $in: ['active', 'probation'] } };
    if (department && department !== 'All') {
      empFilter.department = department;
    }

    const totalHeadcount = await Employee.countDocuments(empFilter);

    // Attrition YTD: resigned or terminated employees this year / (headcount + exits) * 100
    const currentYear = new Date().getFullYear();
    const exitsThisYear = await Employee.countDocuments({
      status: { $in: ['resigned', 'terminated'] },
      exitDate: { $regex: `^${currentYear}` },
      ...(department && department !== 'All' ? { department } : {}),
    });

    const avgHeadcount = Math.max(1, totalHeadcount + exitsThisYear / 2);
    const attritionRate = `${((exitsThisYear / avgHeadcount) * 100).toFixed(1)}%`;

    // Headcount by department
    const headcountByDept = await Employee.aggregate([
      { $match: { status: { $in: ['active', 'probation'] } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Latest payroll run or specific month
    const payrollFilter = {};
    if (month) payrollFilter.month = month;
    const latestPayroll = await PayrollRun.findOne(payrollFilter).sort({ month: -1 }).lean();

    const totalPayrollCost = latestPayroll ? latestPayroll.totalGross : 0;
    const avgSalary = totalHeadcount > 0 && latestPayroll
      ? Math.round(latestPayroll.totalGross / totalHeadcount)
      : 0;

    // Payroll cost by department (from payslips of the latest run)
    let payrollByDept = [];
    if (latestPayroll) {
      payrollByDept = await Payslip.aggregate([
        { $match: { payrollRunId: latestPayroll._id } },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'emp',
          },
        },
        { $unwind: '$emp' },
        {
          $group: {
            _id: '$emp.department',
            totalGross: { $sum: '$gross' },
            totalNet: { $sum: '$netPay' },
            employeeCount: { $sum: 1 },
          },
        },
        { $sort: { totalGross: -1 } },
      ]);
    }

    // Gender breakdown
    const genderBreakdown = await Employee.aggregate([
      { $match: empFilter },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]);

    // Recent audit log entries (10)
    const auditFeed = await AuditLog.find().sort({ createdAt: -1 }).limit(10).lean();

    res.json({
      success: true,
      kpis: {
        headcount: totalHeadcount,
        attritionRate,
        payrollCost: totalPayrollCost,
        avgSalary,
        activePayrollMonth: latestPayroll?.month || 'No run yet',
      },
      headcountByDept: headcountByDept.map((d) => ({ department: d._id || 'Unassigned', count: d.count })),
      payrollByDept: payrollByDept.map((d) => ({ department: d._id, gross: d.totalGross, net: d.totalNet, count: d.employeeCount })),
      genderBreakdown: genderBreakdown.map((g) => ({ gender: g._id || 'Other', count: g.count })),
      auditFeed,
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/dashboards/hr
 * @desc    HR metrics: Headcount, Present today, On leave today, Late today, Pending approvals, trends
 */
export const getHrDashboard = async (req, res) => {
  try {
    const { department } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const empFilter = { status: { $in: ['active', 'probation'] } };
    if (department && department !== 'All') {
      empFilter.department = department;
    }

    const headcount = await Employee.countDocuments(empFilter);
    const empIds = (await Employee.find(empFilter).select('_id').lean()).map((e) => e._id);

    // Today's attendance records
    const todayRecords = await Attendance.find({
      employeeId: { $in: empIds },
      date: today,
    }).lean();

    let presentToday = 0;
    let lateToday = 0;
    let halfDayToday = 0;

    todayRecords.forEach((r) => {
      if (r.status === 'present') presentToday++;
      else if (r.status === 'late') lateToday++;
      else if (r.status === 'half_day') halfDayToday++;
    });

    // Approved leaves for today
    const onLeaveToday = await LeaveRequest.countDocuments({
      employeeId: { $in: empIds },
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    // Pending approvals
    const pendingApprovals = await LeaveRequest.countDocuments({ status: 'pending' });

    // Attendance trend (last 7 calendar days)
    const trendDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendDates.push(d.toISOString().split('T')[0]);
    }

    const pastRecords = await Attendance.find({
      employeeId: { $in: empIds },
      date: { $in: trendDates },
    }).lean();

    const attendanceTrend = trendDates.map((dateStr) => {
      const dateRecords = pastRecords.filter((r) => r.date === dateStr);
      const presentCount = dateRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
      return {
        date: dateStr.slice(5), // MM-DD
        fullDate: dateStr,
        present: presentCount,
        late: dateRecords.filter((r) => r.status === 'late').length,
      };
    });

    // Leave by type distribution this year
    const currentYear = new Date().getFullYear();
    const leaveByType = await LeaveRequest.aggregate([
      {
        $match: {
          employeeId: { $in: empIds },
          status: 'approved',
          startDate: { $regex: `^${currentYear}` },
        },
      },
      {
        $group: {
          _id: '$leaveType',
          totalDays: { $sum: '$workingDaysCount' },
        },
      },
    ]);

    // Top 5 late-comers
    const topLateComers = await Attendance.aggregate([
      { $match: { employeeId: { $in: empIds }, status: 'late' } },
      { $group: { _id: '$employeeId', lateCount: { $sum: 1 } } },
      { $sort: { lateCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'emp',
        },
      },
      { $unwind: '$emp' },
      {
        $project: {
          _id: 1,
          name: '$emp.fullName',
          department: '$emp.department',
          lateCount: 1,
        },
      },
    ]);

    // Attendance Rate
    const attendanceRate = headcount > 0
      ? `${Math.round(((presentToday + lateToday + halfDayToday * 0.5) / Math.max(1, headcount - onLeaveToday)) * 100)}%`
      : '0%';

    res.json({
      success: true,
      kpis: {
        headcount,
        presentToday,
        onLeaveToday,
        lateToday,
        pendingApprovals,
        attendanceRate,
      },
      attendanceTrend,
      leaveByType: leaveByType.map((l) => ({ type: l._id, totalDays: l.totalDays })),
      topLateComers,
    });
  } catch (error) {
    console.error('HR Dashboard Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/dashboards/employee
 * @desc    Employee self-service dashboard: hours this week, late count, leave balances, last payslip
 */
export const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No associated employee record found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's attendance
    const todayAttendance = await Attendance.findOne({ employeeId, date: todayStr }).lean();

    // Work hours this week (Mon to Sun)
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // Mon=1, Sun=7
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    const mondayStr = monday.toISOString().split('T')[0];

    const weekAttendances = await Attendance.find({
      employeeId,
      date: { $gte: mondayStr, $lte: todayStr },
    }).lean();

    const hoursThisWeek = weekAttendances.reduce((acc, curr) => acc + (curr.workHours || 0), 0);

    // Late count this month
    const currentMonth = todayStr.slice(0, 7);
    const lateCount = await Attendance.countDocuments({
      employeeId,
      status: 'late',
      date: { $regex: `^${currentMonth}` },
    });

    // Leave Balances
    const balanceInfo = await getMyLeaveBalance({}, { employeeId });

    // Last Payslip
    const lastPayslip = await Payslip.findOne({ employeeId }).sort({ month: -1 }).lean();

    // Announcements
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(3).lean();

    res.json({
      success: true,
      todayAttendance,
      hoursThisWeek: parseFloat(hoursThisWeek.toFixed(1)),
      targetHours: 40,
      lateCountThisMonth: lateCount,
      leaveBalances: balanceInfo.balances,
      lastPayslip,
      announcements,
    });
  } catch (error) {
    console.error('Employee Dashboard Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
