import PayrollRun from '../models/PayrollRun.js';
import Payslip from '../models/Payslip.js';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';
import OrgSettings from '../models/OrgSettings.js';
import { computeEmployeePayroll } from '../services/payrollService.js';
import { logAudit } from '../services/auditService.js';

/**
 * @route   POST /api/payroll/run
 * @desc    HR creates/recalculates monthly payroll draft
 */
export const createOrUpdatePayrollRun = async (req, res) => {
  try {
    const { month } = req.body; // YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required' });
    }

    // Check if finalized run already exists -> Locked!
    let run = await PayrollRun.findOne({ month });
    if (run && run.status === 'finalized') {
      return res.status(400).json({
        success: false,
        message: `Payroll run for ${month} is already FINALIZED and locked. It cannot be modified.`,
      });
    }

    const settings = await OrgSettings.findOne().lean();
    const activeEmployees = await Employee.find({
      status: { $in: ['active', 'probation'] },
      joiningDate: { $lte: `${month}-31` },
    }).lean();

    if (activeEmployees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible employees found for this payroll month.',
      });
    }

    if (!run) {
      run = new PayrollRun({
        month,
        status: 'draft',
        preparedBy: req.user._id,
      });
      await run.save();
    }

    let sumGross = 0;
    let sumDeductions = 0;
    let sumTax = 0;
    let sumNet = 0;
    const generatedPayslips = [];

    for (const emp of activeEmployees) {
      const calc = await computeEmployeePayroll(emp, month, settings);

      const payslip = await Payslip.findOneAndUpdate(
        { payrollRunId: run._id, employeeId: emp._id },
        {
          ...calc,
          payrollRunId: run._id,
          employeeId: emp._id,
          status: 'draft',
        },
        { upsert: true, new: true }
      );

      sumGross += calc.proratedGross;
      sumDeductions += calc.totalDeductions;
      sumTax += calc.monthlyTax;
      sumNet += calc.netPay;
      generatedPayslips.push(payslip);
    }

    run.totalEmployees = activeEmployees.length;
    run.totalGross = sumGross;
    run.totalDeductions = sumDeductions;
    run.totalTax = sumTax;
    run.totalNet = sumNet;
    run.preparedBy = req.user._id;
    await run.save();

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'Payroll',
      entityId: run._id,
      description: `Payroll draft calculated for ${month} (${run.totalEmployees} employees, Net: PKR ${run.totalNet.toLocaleString()})`,
      after: { month, totalNet: run.totalNet, status: 'draft' },
    });

    res.status(201).json({
      success: true,
      message: `Payroll draft prepared for ${month}`,
      run,
      payslipsCount: generatedPayslips.length,
    });
  } catch (error) {
    console.error('Payroll Run Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/payroll/runs
 * @desc    List all payroll runs
 */
export const getPayrollRuns = async (req, res) => {
  try {
    const runs = await PayrollRun.find()
      .populate('preparedBy', 'name email')
      .populate('finalizedBy', 'name email')
      .sort({ month: -1 })
      .lean();

    res.json({ success: true, runs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/payroll/runs/:id
 * @desc    Get detailed payroll run with all payslips
 */
export const getPayrollRunDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id)
      .populate('preparedBy', 'name')
      .populate('finalizedBy', 'name')
      .lean();

    if (!run) return res.status(404).json({ success: false, message: 'Payroll run not found' });

    const payslips = await Payslip.find({ payrollRunId: id })
      .populate('employeeId', 'employeeCode fullName email department designation')
      .lean();

    res.json({ success: true, run, payslips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PATCH /api/payroll/runs/:id/finalize
 * @desc    Admin finalizes payroll (Locks the month)
 */
export const finalizePayrollRun = async (req, res) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id);

    if (!run) return res.status(404).json({ success: false, message: 'Payroll run not found' });
    if (run.status === 'finalized') {
      return res.status(400).json({ success: false, message: 'This payroll run is already finalized and locked.' });
    }

    const before = run.toObject();

    run.status = 'finalized';
    run.finalizedBy = req.user._id;
    run.finalizedAt = new Date();
    await run.save();

    // Lock all associated payslips
    await Payslip.updateMany({ payrollRunId: id }, { status: 'finalized' });

    // Send notifications to all active employees with userId
    const payslips = await Payslip.find({ payrollRunId: id }).populate('employeeId', 'userId fullName');
    for (const ps of payslips) {
      if (ps.employeeId?.userId) {
        await Notification.create({
          userId: ps.employeeId.userId,
          title: `Payslip Available (${run.month})`,
          message: `Your finalized payslip for ${run.month} is now ready for download. Net Pay: PKR ${ps.netPay.toLocaleString()}`,
          type: 'payroll',
          link: `/payslips/${ps._id}`,
        }).catch(() => {});
      }
    }

    await logAudit({
      req,
      action: 'FINALIZE',
      entity: 'Payroll',
      entityId: run._id,
      description: `Admin finalized and locked monthly payroll for ${run.month}. Total payout: PKR ${run.totalNet.toLocaleString()}`,
      before,
      after: run,
    });

    res.json({
      success: true,
      message: `Payroll for ${run.month} finalized and locked successfully!`,
      run,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/payroll/payslips/:id
 * @desc    Get single payslip (Admin, HR, or own for Employee)
 */
export const getPayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const payslip = await Payslip.findById(id)
      .populate('employeeId', 'employeeCode fullName email phone department designation joiningDate')
      .lean();

    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });

    // Scope check: If employee, only allow own payslip
    if (req.user.role === 'employee' && String(payslip.employeeId?._id) !== String(req.user.employeeId)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own payslip.' });
    }

    const settings = await OrgSettings.findOne().lean();

    res.json({
      success: true,
      payslip,
      company: {
        name: settings?.companyName || 'Enterprise HCM Corp.',
        address: settings?.location?.address || 'Corporate Headquarters',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/payroll/my-payslips
 * @desc    Get all payslips for currently logged-in employee
 */
export const getMyPayslips = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.json({ success: true, payslips: [] });
    }

    const payslips = await Payslip.find({ employeeId }).sort({ month: -1 }).lean();
    res.json({ success: true, payslips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
