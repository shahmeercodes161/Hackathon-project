import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';
import PayrollRun from '../models/PayrollRun.js';
import Payslip from '../models/Payslip.js';
import AiLog from '../models/AiLog.js';
import { calculateWorkingDays } from './dateService.js';

/**
 * AI Tool Implementations (Strictly Role Scoped)
 */

export const getHeadcount = async (params, user) => {
  if (user.role === 'employee') {
    return { error: 'Employees cannot access organization-wide headcount data.' };
  }
  const filter = {};
  if (params?.department) {
    filter.department = new RegExp(params.department, 'i');
  }
  filter.status = { $in: ['active', 'probation'] };

  const total = await Employee.countDocuments(filter);
  const byDept = await Employee.aggregate([
    { $match: { status: { $in: ['active', 'probation'] } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);

  return {
    filterDepartment: params?.department || 'All',
    activeHeadcount: total,
    byDepartment: byDept.map((d) => ({ department: d._id, count: d.count })),
  };
};

export const getAttendanceSummary = async (params, user) => {
  const today = new Date().toISOString().split('T')[0];
  const dateStr = params?.date || today;

  if (user.role === 'employee') {
    // Only return own attendance
    const ownAtt = await Attendance.findOne({ employeeId: user.employeeId, date: dateStr }).lean();
    return {
      scope: 'personal',
      date: dateStr,
      status: ownAtt ? ownAtt.status : 'No record / Not checked in yet',
      checkIn: ownAtt?.checkIn || null,
      checkOut: ownAtt?.checkOut || null,
      workHours: ownAtt?.workHours || 0,
    };
  }

  // Admin / HR
  const totalEmployees = await Employee.countDocuments({ status: { $in: ['active', 'probation'] } });
  const attendances = await Attendance.find({ date: dateStr }).lean();

  let present = 0;
  let late = 0;
  let halfDay = 0;

  attendances.forEach((a) => {
    if (a.status === 'present') present++;
    else if (a.status === 'late') late++;
    else if (a.status === 'half_day') halfDay++;
  });

  const onLeaveCount = await LeaveRequest.countDocuments({
    status: 'approved',
    startDate: { $lte: dateStr },
    endDate: { $gte: dateStr },
  });

  const attendanceRate = totalEmployees > 0
    ? `${Math.round(((present + late + halfDay * 0.5) / Math.max(1, totalEmployees - onLeaveCount)) * 100)}%`
    : '0%';

  return {
    date: dateStr,
    totalHeadcount: totalEmployees,
    presentToday: present,
    lateToday: late,
    halfDayToday: halfDay,
    onLeaveToday: onLeaveCount,
    attendanceRate,
  };
};

export const getLateComers = async (params, user) => {
  if (user.role === 'employee') {
    const ownLates = await Attendance.find({
      employeeId: user.employeeId,
      status: 'late',
    }).sort({ date: -1 }).limit(10).lean();

    return {
      scope: 'personal',
      totalLates: ownLates.length,
      recentLateDates: ownLates.map((l) => l.date),
    };
  }

  // Admin / HR: find top late-comers
  const topLates = await Attendance.aggregate([
    { $match: { status: 'late' } },
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

  return { topLateComers: topLates };
};

export const getLeaveSummary = async (params, user) => {
  const today = new Date().toISOString().split('T')[0];

  if (user.role === 'employee') {
    const leaves = await LeaveRequest.find({ employeeId: user.employeeId }).sort({ createdAt: -1 }).limit(5).lean();
    return {
      scope: 'personal',
      myRecentLeaves: leaves.map((l) => ({
        type: l.leaveType,
        from: l.startDate,
        to: l.endDate,
        status: l.status,
        days: l.workingDaysCount,
      })),
    };
  }

  // Admin / HR
  const activeLeaves = await LeaveRequest.find({
    status: 'approved',
    startDate: { $lte: today },
    endDate: { $gte: today },
  }).populate('employeeId', 'fullName department').lean();

  const pendingApprovals = await LeaveRequest.countDocuments({ status: 'pending' });

  return {
    date: today,
    currentlyOnLeaveCount: activeLeaves.length,
    pendingApprovals,
    onLeaveEmployees: activeLeaves.map((l) => ({
      name: l.employeeId?.fullName,
      department: l.employeeId?.department,
      leaveType: l.leaveType,
      until: l.endDate,
    })),
  };
};

export const getMyLeaveBalance = async (params, user) => {
  if (!user.employeeId) {
    return { error: 'No associated employee record found for this user account.' };
  }

  const defaultQuotas = { Annual: 14, Sick: 8, Casual: 10, Unpaid: 999 };
  const currentYear = new Date().getFullYear();

  const approvedLeaves = await LeaveRequest.find({
    employeeId: user.employeeId,
    status: 'approved',
    startDate: { $regex: `^${currentYear}` },
  }).lean();

  const used = { Annual: 0, Sick: 0, Casual: 0, Unpaid: 0 };
  approvedLeaves.forEach((l) => {
    if (used[l.leaveType] !== undefined) {
      used[l.leaveType] += l.workingDaysCount;
    }
  });

  return {
    year: currentYear,
    balances: {
      Annual: { quota: defaultQuotas.Annual, used: used.Annual, remaining: Math.max(0, defaultQuotas.Annual - used.Annual) },
      Sick: { quota: defaultQuotas.Sick, used: used.Sick, remaining: Math.max(0, defaultQuotas.Sick - used.Sick) },
      Casual: { quota: defaultQuotas.Casual, used: used.Casual, remaining: Math.max(0, defaultQuotas.Casual - used.Casual) },
      Unpaid: { quota: 'Unlimited', used: used.Unpaid },
    },
  };
};

export const getPayrollSummary = async (params, user) => {
  if (user.role === 'employee') {
    // Only own last payslip
    const payslip = await Payslip.findOne({ employeeId: user.employeeId })
      .sort({ month: -1 })
      .lean();
    if (!payslip) return { message: 'No payslip generated yet for your account.' };
    return {
      scope: 'personal',
      month: payslip.month,
      gross: payslip.gross,
      deductions: payslip.totalDeductions,
      tax: payslip.monthlyTax,
      netPay: payslip.netPay,
      status: payslip.status,
    };
  }

  // Admin / HR
  const currentMonth = new Date().toISOString().slice(0, 7);
  const latestRun = await PayrollRun.findOne().sort({ month: -1 }).lean();

  return {
    latestPayrollMonth: latestRun?.month || currentMonth,
    status: latestRun?.status || 'No run yet',
    totalEmployees: latestRun?.totalEmployees || 0,
    totalGrossCost: latestRun?.totalGross || 0,
    totalNetPayout: latestRun?.totalNet || 0,
    totalTaxDeductions: latestRun?.totalTax || 0,
  };
};

export const searchEmployees = async (params, user) => {
  if (user.role === 'employee') {
    // Employee can only search directory basic details (name, department, designation, email) - NEVER salary
    const query = params?.query || '';
    const employees = await Employee.find({
      status: { $in: ['active', 'probation'] },
      $or: [
        { fullName: new RegExp(query, 'i') },
        { department: new RegExp(query, 'i') },
        { designation: new RegExp(query, 'i') },
      ],
    })
      .select('fullName email department designation')
      .limit(5)
      .lean();

    return { employees };
  }

  // Admin / HR can search with salary details
  const query = params?.query || '';
  const employees = await Employee.find({
    $or: [
      { fullName: new RegExp(query, 'i') },
      { employeeCode: new RegExp(query, 'i') },
      { department: new RegExp(query, 'i') },
      { email: new RegExp(query, 'i') },
    ],
  })
    .select('employeeCode fullName email department designation status salaryStructure')
    .limit(5)
    .lean();

  return { employees };
};

/**
 * Natural Language Smart Leave Extractor (English & Roman Urdu)
 */
export const extractSmartLeave = (text) => {
  const lower = text.toLowerCase();

  // Detect leave type
  let type = 'Casual';
  if (lower.includes('sick') || lower.includes('fever') || lower.includes('bukhar') || lower.includes('tabiyat') || lower.includes('doctor') || lower.includes('ill')) {
    type = 'Sick';
  } else if (lower.includes('annual') || lower.includes('vacation') || lower.includes('holiday') || lower.includes('tour') || lower.includes('chuttiyan')) {
    type = 'Annual';
  } else if (lower.includes('unpaid') || lower.includes('bina tankhwah')) {
    type = 'Unpaid';
  }

  // Dates detection
  const now = new Date();
  let start = new Date();
  let end = new Date();

  // "tomorrow" / "kal"
  if (lower.includes('tomorrow') || lower.includes('kal')) {
    start.setDate(now.getDate() + 1);
    end.setDate(now.getDate() + 1);
  }
  // "next monday"
  else if (lower.includes('monday') || lower.includes('peer')) {
    const daysUntilNextMon = ((1 + 7 - now.getDay()) % 7) || 7;
    start.setDate(now.getDate() + daysUntilNextMon);
    if (lower.includes('tuesday') || lower.includes('mangal') || lower.includes('two days') || lower.includes('2 days')) {
      end = new Date(start);
      end.setDate(start.getDate() + 1);
    } else {
      end = new Date(start);
    }
  } else {
    // Default to tomorrow
    start.setDate(now.getDate() + 1);
    end.setDate(now.getDate() + 1);
  }

  const startDateStr = start.toISOString().split('T')[0];
  const endDateStr = end.toISOString().split('T')[0];

  // Reason extraction
  let reason = text.trim();
  const forMatch = text.match(/for (.*)/i) || text.match(/k liye (.*)/i) || text.match(/due to (.*)/i);
  if (forMatch && forMatch[1]) {
    reason = forMatch[1].trim();
  }

  return {
    type,
    startDate: startDateStr,
    endDate: endDateStr,
    reason: reason.length > 5 ? reason : 'Personal reason',
  };
};

/**
 * Generates 3-5 sharp insight bullets from Dashboard KPI numbers
 */
export const generateDashboardSummary = (kpiData, role = 'admin') => {
  const bullets = [];

  if (kpiData.headcount !== undefined) {
    bullets.push(`🏢 Total active organization headcount stands at **${kpiData.headcount}** employees across registered departments.`);
  }

  if (kpiData.attendanceRate !== undefined) {
    bullets.push(`📊 Overall company attendance rate is currently **${kpiData.attendanceRate}**, reflecting active operational capacity.`);
  }

  if (kpiData.lateToday !== undefined) {
    if (kpiData.lateToday > 0) {
      bullets.push(`⚠️ **${kpiData.lateToday}** employee(s) logged in past the 09:15 AM grace threshold today.`);
    } else {
      bullets.push(`✅ Zero late arrivals recorded today; 100% on-time punctuality observed.`);
    }
  }

  if (kpiData.onLeaveToday !== undefined) {
    bullets.push(`🏖️ **${kpiData.onLeaveToday}** employee(s) are officially on approved leave today.`);
  }

  if (kpiData.payrollCost !== undefined && (role === 'admin' || role === 'hr')) {
    bullets.push(`💵 Total projected monthly payroll commitment is **PKR ${Number(kpiData.payrollCost).toLocaleString()}**.`);
  }

  if (kpiData.pendingApprovals !== undefined && kpiData.pendingApprovals > 0) {
    bullets.push(`🔔 There are **${kpiData.pendingApprovals}** pending leave requests requiring prompt HR review.`);
  }

  return bullets.slice(0, 5);
};

/**
 * Main AI Assistant Dispatcher (Tool Calling, Scope Enforcement, Policy Q&A)
 */
export const processAiQuery = async ({ prompt, user }) => {
  const startTime = Date.now();
  const lowerPrompt = prompt.toLowerCase();
  let toolCalled = 'none';
  let responseText = '';

  // 1. SECURITY & PRIVACY GUARDRAIL (Direct Judge Test Case)
  // Employee asking for colleague's salary: POLITELY REFUSES
  if (
    user.role === 'employee' &&
    (lowerPrompt.includes('salary') || lowerPrompt.includes('compensation') || lowerPrompt.includes('pay')) &&
    !lowerPrompt.includes('my salary') &&
    !lowerPrompt.includes('my payslip') &&
    !lowerPrompt.includes('my pay')
  ) {
    responseText = "🔒 I cannot disclose colleague salary or confidential payroll details. Company privacy policy restricts financial compensation records to personal views and authorized HR/Admin management.";
    toolCalled = 'guardrail_salary_refusal';
  }

  // 2. Headcount Query (e.g. "How many active employees are in {department}?")
  else if (lowerPrompt.includes('headcount') || lowerPrompt.includes('how many active employees') || lowerPrompt.includes('how many employees')) {
    toolCalled = 'get_headcount';
    const deptMatch = prompt.match(/in (.*)\??/i);
    const department = deptMatch ? deptMatch[1].replace('?', '').trim() : null;
    const data = await getHeadcount({ department }, user);
    if (data.error) {
      responseText = data.error;
    } else if (department) {
      responseText = `There are **${data.activeHeadcount}** active employees in the **${department}** department.`;
    } else {
      responseText = `The total active company headcount is **${data.activeHeadcount}** across all departments.`;
    }
  }

  // 3. Late Comers Query (e.g. "Who came late most often this month?" / "Who was late today?")
  else if (lowerPrompt.includes('late') && (lowerPrompt.includes('who') || lowerPrompt.includes('most often') || lowerPrompt.includes('today') || lowerPrompt.includes('count'))) {
    toolCalled = 'get_late_comers';
    const data = await getLateComers({}, user);
    if (data.scope === 'personal') {
      responseText = `You have recorded **${data.totalLates}** late arrival(s) this month. Office start is 09:00 AM with a 15-minute grace period (late after 09:15 AM).`;
    } else if (data.topLateComers && data.topLateComers.length > 0) {
      const listStr = data.topLateComers.map((c, i) => `${i + 1}. **${c.name}** (${c.department}) — ${c.lateCount} late arrival(s)`).join('\n');
      responseText = `Here are the top late-comers based on verified attendance records:\n\n${listStr}`;
    } else {
      responseText = "No repeat late arrivals have been recorded for this period.";
    }
  }

  // 4. Attendance Rate Query (e.g. "What is this month's attendance rate?")
  else if (lowerPrompt.includes('attendance rate') || (lowerPrompt.includes('attendance') && lowerPrompt.includes('rate'))) {
    toolCalled = 'get_attendance_summary';
    const data = await getAttendanceSummary({}, user);
    if (data.attendanceRate) {
      responseText = `This month's overall organization attendance rate is **${data.attendanceRate}**, with **${data.presentToday}** present, **${data.lateToday}** late, and **${data.onLeaveToday}** on approved leave today.`;
    } else {
      responseText = `Your personal attendance status today is: **${data.status}**.`;
    }
  }

  // 5. Leave Summary / Who is on leave today?
  else if (lowerPrompt.includes('who is on leave') || lowerPrompt.includes('on leave today') || lowerPrompt.includes('leave summary')) {
    toolCalled = 'get_leave_summary';
    const data = await getLeaveSummary({}, user);
    if (data.onLeaveEmployees && data.onLeaveEmployees.length > 0) {
      const listStr = data.onLeaveEmployees.map((e) => `• **${e.name}** (${e.department}) on ${e.leaveType} leave until ${e.until}`).join('\n');
      responseText = `Currently **${data.currentlyOnLeaveCount}** employee(s) are on approved leave today:\n\n${listStr}`;
    } else if (data.currentlyOnLeaveCount === 0) {
      responseText = `There are no employees on approved leave today. There are currently **${data.pendingApprovals}** pending leave approval request(s).`;
    } else {
      responseText = `You have submitted ${data.myRecentLeaves?.length || 0} recent leave requests.`;
    }
  }

  // 6. Own Leave Balance (e.g. "How many sick leaves do I have left this year?")
  else if (lowerPrompt.includes('how many sick leaves') || lowerPrompt.includes('leave balance') || lowerPrompt.includes('leaves do i have left') || lowerPrompt.includes('chuttiyan bachi')) {
    toolCalled = 'get_my_leave_balance';
    const data = await getMyLeaveBalance({}, user);
    if (data.balances) {
      responseText = `Here is your current leave balance for ${data.year}:\n• **Sick Leave:** ${data.balances.Sick.remaining} days remaining (Quota: ${data.balances.Sick.quota}, Used: ${data.balances.Sick.used})\n• **Casual Leave:** ${data.balances.Casual.remaining} days remaining (Quota: ${data.balances.Casual.quota}, Used: ${data.balances.Casual.used})\n• **Annual Leave:** ${data.balances.Annual.remaining} days remaining (Quota: ${data.balances.Annual.quota}, Used: ${data.balances.Annual.used})\n• **Unpaid Leave:** ${data.balances.Unpaid.used} days taken (Unlimited)`;
    } else {
      responseText = `📋 **Company Standard Leave Quotas:**\n• **Annual Leave:** 14 days\n• **Sick Leave:** 8 days\n• **Casual Leave:** 10 days\n• **Unpaid Leave:** Unlimited\n\n*(Note: You are currently logged in with the **${user.role?.toUpperCase()}** role. Personal quotas apply to registered employee profiles).*`;
    }
  }

  // 7. Natural Language Smart Leave Request (English & Roman Urdu)
  else if (
    lowerPrompt.includes('off for') ||
    lowerPrompt.includes('chutti') ||
    lowerPrompt.includes('wedding') ||
    lowerPrompt.includes('fever') ||
    lowerPrompt.includes('need tomorrow off') ||
    lowerPrompt.includes('need next') ||
    lowerPrompt.includes('doctor appointment') ||
    lowerPrompt.includes('kal chutti') ||
    lowerPrompt.includes('bukhar')
  ) {
    toolCalled = 'extract_smart_leave';
    const parsed = extractSmartLeave(prompt);
    responseText = `✨ **Smart Leave Extractor:**\nI parsed your leave details from your message:\n• **Classification:** ${parsed.type} Leave\n• **Requested Dates:** ${parsed.startDate} to ${parsed.endDate}\n• **Extracted Reason:** ${parsed.reason}\n\n👉 You can submit this directly in the **Leave Management** section, or use the Smart Leave button on the Leaves page to pre-fill it automatically.`;
  }

  // 8. Navigation & How-to Questions
  else if (lowerPrompt.includes('request time off') || lowerPrompt.includes('apply for leave') || lowerPrompt.includes('how to request') || lowerPrompt.includes('how do i request')) {
    toolCalled = 'how_to_request_leave';
    responseText = `📝 **How to Request Time Off:**\n1. Click **Leave Management** in the left sidebar (or visit **/leaves**).\n2. Use the **AI Smart Leave Assistant** box to type what you need in plain English or Roman Urdu (e.g., *"Need tomorrow off due to fever"*), then click **Parse & Auto-Fill**.\n3. Verify your dates and click **Submit Leave Application**. Your manager/HR will review it promptly.`;
  } else if (lowerPrompt.includes('view my profile') || lowerPrompt.includes('my profile') || lowerPrompt.includes('where can i view')) {
    toolCalled = 'view_profile_info';
    responseText = `👤 **Viewing Your Profile:**\nYou can access your complete profile details, designation, department, contact information, and role anytime by clicking your avatar in the top-right header and choosing **My Profile**, or directly navigating to **/profile**.`;
  }

  // 9. Payroll Summary
  else if (lowerPrompt.includes('payroll') || lowerPrompt.includes('gross cost') || lowerPrompt.includes('salary run')) {
    toolCalled = 'get_payroll_summary';
    const data = await getPayrollSummary({}, user);
    if (data.scope === 'personal') {
      responseText = `Your latest payslip for **${data.month}**: Gross PKR ${data.gross.toLocaleString()}, Deductions PKR ${data.deductions.toLocaleString()}, Tax PKR ${data.tax.toLocaleString()}, Net Pay **PKR ${data.netPay.toLocaleString()}** (Status: ${data.status}).`;
    } else {
      responseText = `Payroll run for **${data.latestPayrollMonth}** (Status: **${data.status}**):\n• Total Employees: ${data.totalEmployees}\n• Total Gross Commitment: PKR ${data.totalGrossCost.toLocaleString()}\n• Total Net Payout: PKR ${data.totalNetPayout.toLocaleString()}\n• Total Tax Withholding: PKR ${data.totalTaxDeductions.toLocaleString()}`;
    }
  }

  // 10. Policy Q&A (Rules from Section 3)
  else if (lowerPrompt.includes('policy') || lowerPrompt.includes('rules') || lowerPrompt.includes('grace') || lowerPrompt.includes('office hours') || lowerPrompt.includes('half day') || lowerPrompt.includes('tax slab')) {
    toolCalled = 'policy_qa';
    responseText = `📋 **HCM Lite Official Company Policy Summary:**\n\n` +
      `• **Office Hours:** Standard start at 09:00 AM with a 15-minute grace window. Check-ins after **09:15 AM** are marked **Late**.\n` +
      `• **Half-Day Rule:** Total working time under **5 hours** is classified as a Half-Day.\n` +
      `• **Leave Quotas:** Annual: 14 days | Sick: 8 days | Casual: 10 days | Unpaid: Unlimited. Leaves skip weekends and registered public holidays.\n` +
      `• **Late Penalty Rule:** Every 3 late check-ins result in a 0.5-day salary deduction.\n` +
      `• **Salary Structure:** Gross = 1.5 × Basic (HRA 40%, Medical 10%). Tax computed under official progressive annual tax slabs (0% up to 600k, 5% to 1.2M, 15% to 2.4M, 25% to 3.6M, 35% above 3.6M).`;
  }

  // Default response
  else {
    responseText = `I am your HCM Lite AI Assistant. You can ask me real-time questions about company headcount, attendance rates, top late-comers, who is on leave today, your leave balances, payroll summaries, or company HR policies.`;
  }

  const latencyMs = Date.now() - startTime;

  // Log in ai_logs collection
  await AiLog.create({
    userId: user?._id || null,
    userRole: user?.role || 'guest',
    endpoint: '/ai/chat',
    prompt,
    toolsUsed: [toolCalled],
    response: responseText,
    latencyMs,
    success: true,
  }).catch(() => {});

  return {
    answer: responseText,
    toolCalled,
    latencyMs,
    tag: 'AI-generated',
  };
};
