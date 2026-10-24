import OrgSettings from '../models/OrgSettings.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import LeaveType from '../models/LeaveType.js';
import Holiday from '../models/Holiday.js';
import { logAudit } from '../services/auditService.js';

// --- Org Settings ---
export const getOrgSettings = async (req, res) => {
  try {
    let settings = await OrgSettings.findOne().lean();
    if (!settings) {
      settings = await OrgSettings.create({});
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrgSettings = async (req, res) => {
  try {
    const before = await OrgSettings.findOne().lean();
    const updated = await OrgSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'Company',
      entityId: updated._id,
      description: 'Updated company configuration & office settings',
      before,
      after: updated,
    });

    res.json({ success: true, message: 'Settings updated successfully', settings: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Departments ---
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code are required' });

    const dept = await Department.create({ name, code: code.toUpperCase(), description });
    await logAudit({ req, action: 'CREATE', entity: 'Department', entityId: dept._id, after: dept });

    res.status(201).json({ success: true, department: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    await logAudit({ req, action: 'DELETE', entity: 'Department', entityId: dept._id, before: dept });
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Designations ---
export const getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find().populate('department', 'name code').sort({ title: 1 }).lean();
    res.json({ success: true, designations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDesignation = async (req, res) => {
  try {
    const { title, department } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const desig = await Designation.create({ title, department: department || null });
    res.status(201).json({ success: true, designation: desig });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Leave Types ---
export const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ name: 1 }).lean();
    res.json({ success: true, leaveTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLeaveType = async (req, res) => {
  try {
    const { name, code, quota, isPaid, isUnlimited, description } = req.body;
    const lt = await LeaveType.create({ name, code: code?.toUpperCase() || name.slice(0, 3).toUpperCase(), quota, isPaid, isUnlimited, description });
    await logAudit({ req, action: 'CREATE', entity: 'LeaveType', entityId: lt._id, after: lt });
    res.status(201).json({ success: true, leaveType: lt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Holidays ---
export const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 }).lean();
    res.json({ success: true, holidays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { title, date, description } = req.body;
    if (!title || !date) return res.status(400).json({ success: false, message: 'Title and date (YYYY-MM-DD) are required' });

    const hol = await Holiday.create({ title, date, description });
    await logAudit({ req, action: 'CREATE', entity: 'Holiday', entityId: hol._id, after: hol });
    res.status(201).json({ success: true, holiday: hol });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const hol = await Holiday.findByIdAndDelete(req.params.id);
    if (!hol) return res.status(404).json({ success: false, message: 'Holiday not found' });
    await logAudit({ req, action: 'DELETE', entity: 'Holiday', entityId: hol._id, before: hol });
    res.json({ success: true, message: 'Holiday deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
