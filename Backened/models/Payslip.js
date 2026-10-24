import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema(
  {
    payrollRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: String, // YYYY-MM
      required: true,
    },
    // Salary components
    basic: { type: Number, required: true },
    hra: { type: Number, required: true },
    medical: { type: Number, required: true },
    gross: { type: Number, required: true },
    proratedGross: { type: Number, required: true },

    // Attendance stats for the month
    workingDaysInMonth: { type: Number, required: true },
    eligibleDays: { type: Number, required: true },
    presentDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    penaltyDays: { type: Number, default: 0 }, // 3 lates = 0.5 day

    // Financial calculations
    perDayRate: { type: Number, required: true },
    totalDeductionDays: { type: Number, default: 0 },
    leaveDeductions: { type: Number, default: 0 },
    latePenaltyDeduction: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },

    // Tax calculation
    annualGross: { type: Number, required: true },
    annualTax: { type: Number, default: 0 },
    taxSlab: { type: String, default: '0%' },
    monthlyTax: { type: Number, default: 0 },

    // Net pay
    netPay: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

payslipSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });

const Payslip = mongoose.model('Payslip', payslipSchema);
export default Payslip;
