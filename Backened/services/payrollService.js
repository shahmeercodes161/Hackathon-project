import { getWorkingDaysInMonth, calculateWorkingDays } from './dateService.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import OrgSettings from '../models/OrgSettings.js';

/**
 * Calculates annual tax according to Saylani Hackathon Tax Slabs:
 * - 0 to 600k: 0%
 * - 600k to 1.2M: 5% of (Annual Gross - 600k)
 * - 1.2M to 2.4M: 30k + 15% of (Annual Gross - 1.2M)
 * - 2.4M to 3.6M: 210k + 25% of (Annual Gross - 2.4M)
 * - > 3.6M: 510k + 35% of (Annual Gross - 3.6M)
 */
export const calculateTaxSlab = (annualGross) => {
  let annualTax = 0;
  let slabDescription = '0%';

  if (annualGross <= 600000) {
    annualTax = 0;
    slabDescription = '0% (Up to 600,000 PKR)';
  } else if (annualGross <= 1200000) {
    annualTax = (annualGross - 600000) * 0.05;
    slabDescription = '5% on excess of 600,000 PKR';
  } else if (annualGross <= 2400000) {
    annualTax = 30000 + (annualGross - 1200000) * 0.15;
    slabDescription = '30,000 + 15% on excess of 1,200,000 PKR';
  } else if (annualGross <= 3600000) {
    annualTax = 210000 + (annualGross - 2400000) * 0.25;
    slabDescription = '210,000 + 25% on excess of 2,400,000 PKR';
  } else {
    annualTax = 510000 + (annualGross - 3600000) * 0.35;
    slabDescription = '510,000 + 35% on excess of 3,600,000 PKR';
  }

  annualTax = Math.max(0, Math.round(annualTax));
  const monthlyTax = Math.round(annualTax / 12);

  return { annualTax, monthlyTax, slabDescription };
};

/**
 * Computes monthly payroll breakdown for an employee in a given month (YYYY-MM)
 */
export const computeEmployeePayroll = async (employee, yearMonth, settings = null) => {
  if (!settings) {
    settings = await OrgSettings.findOne().lean();
  }

  const { totalWorkingDays, workingDates } = await getWorkingDaysInMonth(yearMonth);
  const basic = Number(employee.salaryStructure?.basic || 0);
  const hra = Math.round(basic * 0.4);
  const medical = Math.round(basic * 0.1);
  const fullGross = Math.round(basic * 1.5);

  // Check join date proration: if joined this month, count eligible working days
  let eligibleDays = totalWorkingDays;
  const joinDate = employee.joiningDate;
  if (joinDate && joinDate.startsWith(yearMonth)) {
    eligibleDays = workingDates.filter((d) => d >= joinDate).length;
  }

  // Prorated gross if joined mid-month
  const prorationFactor = totalWorkingDays > 0 ? eligibleDays / totalWorkingDays : 1;
  const proratedGross = Math.round(fullGross * prorationFactor);

  const perDayRate = totalWorkingDays > 0 ? Math.round((fullGross / totalWorkingDays) * 100) / 100 : 0;

  // Fetch all attendance records for this employee in this month
  const attendanceRecords = await Attendance.find({
    employeeId: employee._id,
    date: { $regex: `^${yearMonth}` },
  }).lean();

  const attendanceMap = new Map();
  attendanceRecords.forEach((att) => {
    attendanceMap.set(att.date, att);
  });

  // Fetch approved leaves in this month
  const approvedLeaves = await LeaveRequest.find({
    employeeId: employee._id,
    status: 'approved',
    startDate: { $lte: `${yearMonth}-31` },
    endDate: { $gte: `${yearMonth}-01` },
  }).lean();

  // Map each working date to status
  let presentDays = 0;
  let lateDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let unpaidLeaveDays = 0;

  const relevantWorkingDates = workingDates.filter((d) => !joinDate || d >= joinDate);

  relevantWorkingDates.forEach((dateStr) => {
    const att = attendanceMap.get(dateStr);
    const hasApprovedLeave = approvedLeaves.some((l) => l.startDate <= dateStr && l.endDate >= dateStr);
    const isUnpaidLeave = approvedLeaves.some(
      (l) => l.startDate <= dateStr && l.endDate >= dateStr && (l.leaveType === 'Unpaid' || l.leaveType === 'unpaid')
    );

    if (isUnpaidLeave) {
      unpaidLeaveDays++;
    } else if (hasApprovedLeave) {
      // Paid leave, no deduction
    } else if (att) {
      if (att.status === 'present') presentDays++;
      else if (att.status === 'late') lateDays++;
      else if (att.status === 'half_day') halfDays++;
      else if (att.status === 'missing_checkout') lateDays++; // treated as missing checkout
    } else {
      absentDays++;
    }
  });

  // Bonus penalty rule: 3 lates = 0.5 day deduction
  let penaltyDays = 0;
  if (settings?.latePenaltyRule) {
    penaltyDays = Math.floor(lateDays / 3) * 0.5;
  }

  // Deductions calculation: (absent + unpaid + 0.5 * halfDays + penaltyDays) * perDayRate
  const totalDeductionDays = absentDays + unpaidLeaveDays + 0.5 * halfDays + penaltyDays;
  const leaveDeductions = Math.round((absentDays + unpaidLeaveDays + 0.5 * halfDays) * perDayRate);
  const latePenaltyDeduction = Math.round(penaltyDays * perDayRate);
  const totalDeductions = leaveDeductions + latePenaltyDeduction;

  // Tax computation on Annual Gross
  const annualGross = proratedGross * 12;
  const { annualTax, monthlyTax, slabDescription } = calculateTaxSlab(annualGross);

  const netPay = Math.max(0, proratedGross - totalDeductions - monthlyTax);

  return {
    employeeId: employee._id,
    month: yearMonth,
    basic,
    hra,
    medical,
    gross: fullGross,
    proratedGross,
    workingDaysInMonth: totalWorkingDays,
    eligibleDays,
    presentDays,
    lateDays,
    halfDays,
    absentDays,
    unpaidLeaveDays,
    penaltyDays,
    perDayRate,
    totalDeductionDays,
    leaveDeductions,
    latePenaltyDeduction,
    totalDeductions,
    annualGross,
    annualTax,
    taxSlab: slabDescription,
    monthlyTax,
    netPay,
  };
};
