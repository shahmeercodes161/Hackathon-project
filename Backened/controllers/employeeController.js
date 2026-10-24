import bcrypt from 'bcryptjs';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payslip from '../models/Payslip.js';
import { logAudit } from '../services/auditService.js';
import { getMyLeaveBalance } from '../services/aiService.js';

/**
 * @route   POST /api/employees
 * @desc    HR registers an employee -> auto-creates user login with temporary password
 */
export const registerEmployee = async (req, res) => {
  try {
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      address,
      gender = 'Male',
      department,
      designation,
      joiningDate,
      basicSalary,
      temporaryPassword = 'password123',
    } = req.body;

    if (!employeeCode || !firstName || !lastName || !email || !department || !designation || !joiningDate || !basicSalary) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (code, name, email, department, designation, joining date, basic salary)',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check unique employee code & email
    const existingEmp = await Employee.findOne({
      $or: [{ employeeCode: employeeCode.toUpperCase().trim() }, { email: cleanEmail }],
    });
    if (existingEmp) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this Employee Code or Email already exists.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user account with this email already exists.' });
    }

    const basic = Number(basicSalary);
    if (isNaN(basic) || basic <= 0) {
      return res.status(400).json({ success: false, message: 'Basic salary must be a positive number' });
    }

    // 1. Create Employee record
    const employee = new Employee({
      employeeCode: employeeCode.toUpperCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone: phone || '',
      address: address || '',
      gender,
      department: department.trim(),
      designation: designation.trim(),
      joiningDate,
      salaryStructure: {
        basic,
      },
    });
    await employee.save();

    // 2. Create User account with temporary password & mustChangePassword = true
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    const user = await User.create({
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: cleanEmail,
      password: hashedPassword,
      role: 'employee',
      employeeId: employee._id,
      mustChangePassword: true,
      isActive: true,
    });

    // Link user to employee
    employee.userId = user._id;
    await employee.save();

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'Employee',
      entityId: employee._id,
      description: `Registered employee ${employee.employeeCode} (${employee.fullName}) and generated login`,
      after: { employeeCode: employee.employeeCode, email: employee.email, department: employee.department },
    });

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully with temporary login created',
      employee,
      tempLogin: {
        email: cleanEmail,
        temporaryPassword,
        mustChangePassword: true,
      },
    });
  } catch (error) {
    console.error('Register Employee Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/employees
 * @desc    Directory with server-side search, filters, pagination
 */
export const getEmployees = async (req, res) => {
  try {
    const { search, department, designation, status, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { employeeCode: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (designation && designation !== 'All') {
      query.designation = designation;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    // Role scope guard: if Employee role, only see basic directory or own record
    let selectFields = '';
    if (req.user.role === 'employee') {
      selectFields = 'employeeCode firstName lastName fullName email department designation status joiningDate';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .select(selectFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      employees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/employees/:id/360
 * @desc    Employee 360 profile view (details, attendance, leave balance, payslips)
 */
export const getEmployee360 = async (req, res) => {
  try {
    const { id } = req.params;

    // Scope check: If employee, can only view own 360 profile
    if (req.user.role === 'employee' && String(req.user.employeeId) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own 360 profile.' });
    }

    const employee = await Employee.findById(id).lean();
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Recent attendance
    const recentAttendance = await Attendance.find({ employeeId: id }).sort({ date: -1 }).limit(10).lean();

    // Recent leaves
    const recentLeaves = await LeaveRequest.find({ employeeId: id }).sort({ createdAt: -1 }).limit(5).lean();

    // Leave balance
    const leaveBalances = await getMyLeaveBalance({}, { employeeId: id });

    // Recent payslips
    const payslips = await Payslip.find({ employeeId: id }).sort({ month: -1 }).limit(6).lean();

    res.json({
      success: true,
      profile: employee,
      recentAttendance,
      recentLeaves,
      leaveBalances: leaveBalances.balances,
      payslips,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee profile (HR can update all; Employee can only update own phone & address)
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const before = employee.toObject();

    // Employee self-service
    if (req.user.role === 'employee') {
      if (String(req.user.employeeId) !== String(id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot edit other employee profiles' });
      }
      employee.phone = req.body.phone !== undefined ? req.body.phone : employee.phone;
      employee.address = req.body.address !== undefined ? req.body.address : employee.address;
      await employee.save();

      await logAudit({
        req,
        action: 'UPDATE',
        entity: 'Employee',
        entityId: employee._id,
        description: `Employee updated their contact information`,
        before,
        after: employee,
      });

      return res.json({ success: true, message: 'Profile updated successfully', employee });
    }

    // HR / Admin updating details
    const { firstName, lastName, phone, address, gender, department, designation, status, exitDate, basicSalary } = req.body;

    if (firstName) employee.firstName = firstName;
    if (lastName) employee.lastName = lastName;
    if (phone !== undefined) employee.phone = phone;
    if (address !== undefined) employee.address = address;
    if (gender) employee.gender = gender;
    if (department) employee.department = department;
    if (designation) employee.designation = designation;
    if (status) employee.status = status;
    if (exitDate !== undefined) employee.exitDate = exitDate;

    if (basicSalary && !isNaN(Number(basicSalary))) {
      employee.salaryStructure.basic = Number(basicSalary);
    }

    await employee.save();

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'Employee',
      entityId: employee._id,
      description: `HR/Admin updated employee details for ${employee.employeeCode}`,
      before,
      after: employee,
    });

    res.json({ success: true, message: 'Employee updated successfully', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/employees/csv/dry-run
 * @desc    Dry-run CSV import validation returning row + field + reason
 */
export const dryRunCsvImport = async (req, res) => {
  try {
    const { rows } = req.body; // Array of objects
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide CSV rows array to dry-run' });
    }

    const departments = await Department.find().select('name code').lean();
    const validDeptSet = new Set(departments.map((d) => d.name.toLowerCase()));

    const existingCodes = new Set((await Employee.find().select('employeeCode').lean()).map((e) => e.employeeCode));
    const existingEmails = new Set((await Employee.find().select('email').lean()).map((e) => e.email.toLowerCase()));

    const errors = [];
    const validRows = [];

    const seenBatchCodes = new Set();
    const seenBatchEmails = new Set();

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const rowErrors = [];

      const code = row.employeeCode?.toString().trim().toUpperCase();
      const email = row.email?.toString().trim().toLowerCase();
      const firstName = row.firstName?.toString().trim();
      const lastName = row.lastName?.toString().trim();
      const dept = row.department?.toString().trim();
      const desig = row.designation?.toString().trim();
      const date = row.joiningDate?.toString().trim();
      const salary = Number(row.basicSalary);

      if (!code) rowErrors.push({ row: rowNum, field: 'employeeCode', reason: 'Missing required employeeCode' });
      else if (existingCodes.has(code) || seenBatchCodes.has(code)) {
        rowErrors.push({ row: rowNum, field: 'employeeCode', reason: `Employee code ${code} is already taken` });
      } else {
        seenBatchCodes.add(code);
      }

      if (!email) rowErrors.push({ row: rowNum, field: 'email', reason: 'Missing required email' });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rowErrors.push({ row: rowNum, field: 'email', reason: 'Invalid email format' });
      } else if (existingEmails.has(email) || seenBatchEmails.has(email)) {
        rowErrors.push({ row: rowNum, field: 'email', reason: `Email ${email} is already registered` });
      } else {
        seenBatchEmails.add(email);
      }

      if (!firstName) rowErrors.push({ row: rowNum, field: 'firstName', reason: 'Missing firstName' });
      if (!lastName) rowErrors.push({ row: rowNum, field: 'lastName', reason: 'Missing lastName' });

      if (!dept) rowErrors.push({ row: rowNum, field: 'department', reason: 'Missing department' });
      else if (validDeptSet.size > 0 && !validDeptSet.has(dept.toLowerCase())) {
        rowErrors.push({ row: rowNum, field: 'department', reason: `Unknown department '${dept}'. Create department first.` });
      }

      if (!desig) rowErrors.push({ row: rowNum, field: 'designation', reason: 'Missing designation' });

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        rowErrors.push({ row: rowNum, field: 'joiningDate', reason: 'joiningDate must be in ISO format (YYYY-MM-DD)' });
      }

      if (isNaN(salary) || salary <= 0) {
        rowErrors.push({ row: rowNum, field: 'basicSalary', reason: 'basicSalary must be a positive number' });
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRows.push({
          employeeCode: code,
          firstName,
          lastName,
          email,
          phone: row.phone || '',
          address: row.address || '',
          gender: row.gender || 'Male',
          department: dept,
          designation: desig,
          joiningDate: date,
          basicSalary: salary,
        });
      }
    });

    res.json({
      success: true,
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      errors,
      canCommit: errors.length === 0,
      validRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/employees/csv/commit
 * @desc    Bulk creates valid employees and user accounts with temporary passwords
 */
export const commitCsvImport = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows provided to commit' });
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('welcome123', salt);

    const createdList = [];

    for (const r of rows) {
      const emp = new Employee({
        employeeCode: r.employeeCode,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        phone: r.phone || '',
        address: r.address || '',
        gender: r.gender || 'Male',
        department: r.department,
        designation: r.designation,
        joiningDate: r.joiningDate,
        salaryStructure: { basic: Number(r.basicSalary) },
      });
      await emp.save();

      const user = await User.create({
        name: `${r.firstName} ${r.lastName}`,
        email: r.email,
        password: defaultPasswordHash,
        role: 'employee',
        employeeId: emp._id,
        mustChangePassword: true,
        isActive: true,
      });

      emp.userId = user._id;
      await emp.save();
      createdList.push(emp);
    }

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'Employee',
      description: `Bulk imported ${createdList.length} employees via CSV`,
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdList.length} employee(s) with initial login credentials`,
      count: createdList.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/employees/export/csv
 * @desc    Export employee directory to CSV
 */
export const exportEmployeesCsv = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ employeeCode: 1 }).lean();

    const headers = 'EmployeeCode,FirstName,LastName,FullName,Email,Phone,Gender,Department,Designation,JoiningDate,Status,BasicSalary,HRA,Medical,GrossSalary\n';
    const rows = employees.map((e) => {
      return `"${e.employeeCode}","${e.firstName}","${e.lastName}","${e.fullName}","${e.email}","${e.phone}","${e.gender}","${e.department}","${e.designation}","${e.joiningDate}","${e.status}",${e.salaryStructure?.basic || 0},${e.salaryStructure?.hra || 0},${e.salaryStructure?.medical || 0},${e.salaryStructure?.gross || 0}`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="hcm_employees.csv"');
    res.send(headers + rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
