import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OrgSettings from '../models/OrgSettings.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import LeaveType from '../models/LeaveType.js';
import { logAudit } from '../services/auditService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hackathon_default_secret_key_123', {
    expiresIn: '7d',
  });
};

export const getSetupStatus = async (req, res) => {
  try {
    const settings = await OrgSettings.findOne().lean();
    const adminCount = await User.countDocuments({ role: 'admin' });

    const isSetupComplete = Boolean(settings?.isSetupComplete && adminCount > 0);

    res.json({
      success: true,
      isSetupComplete,
      companyName: settings?.companyName || '',
      hasAdmin: adminCount > 0,
      settings: settings || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const runInitialSetup = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'System is already configured with an Admin account. Please log in.',
      });
    }

    const {
      companyName,
      companyEmail,
      officeStart = '09:00',
      officeEnd = '18:00',
      graceMinutes = 15,
      halfDayHours = 5,
      weekendDays = ['Saturday', 'Sunday'],
      officeAddress = 'Zaitoon Ashraf IT Park',
      latitude = 24.8607,
      longitude = 67.0011,
      radiusMeters = 150,
      adminName,
      adminEmail,
      adminPassword,
    } = req.body;

    if (!companyName || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Company name, Admin name, email, and password are required',
      });
    }

    // 1. Create or update OrgSettings
    let settings = await OrgSettings.findOne();
    if (!settings) {
      settings = new OrgSettings();
    }
    settings.companyName = companyName;
    settings.companyEmail = companyEmail || adminEmail;
    settings.officeHours = {
      start: officeStart,
      end: officeEnd,
      graceMinutes: Number(graceMinutes),
      halfDayHours: Number(halfDayHours),
    };
    settings.weekendDays = weekendDays;
    settings.location = {
      address: officeAddress,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMeters: Number(radiusMeters),
    };
    settings.isSetupComplete = true;
    await settings.save();

    // 2. Create the first Admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      mustChangePassword: false,
      isActive: true,
    });

    // 3. Initialize default Leave Types
    const defaultLeaves = [
      { name: 'Annual', code: 'ANN', quota: 14, isPaid: true, description: 'Annual statutory paid vacation' },
      { name: 'Sick', code: 'SCK', quota: 8, isPaid: true, description: 'Medical and sickness leave' },
      { name: 'Casual', code: 'CAS', quota: 10, isPaid: true, description: 'Short-notice casual personal leave' },
      { name: 'Unpaid', code: 'UNP', quota: 999, isPaid: false, isUnlimited: true, description: 'Unpaid leave of absence' },
    ];
    for (const lt of defaultLeaves) {
      await LeaveType.findOneAndUpdate({ name: lt.name }, lt, { upsert: true, new: true });
    }

    // 4. Initialize default Department
    const defaultDepts = [
      { name: 'Engineering', code: 'ENG', description: 'Software engineering & product development' },
      { name: 'Human Resources', code: 'HR', description: 'People operations and recruitment' },
      { name: 'Operations', code: 'OPS', description: 'Business operations and logistics' },
    ];
    for (const d of defaultDepts) {
      await Department.findOneAndUpdate({ code: d.code }, d, { upsert: true, new: true });
    }

    // 5. Log audit trail
    await logAudit({
      actor: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: 'admin' },
      action: 'CREATE',
      entity: 'Company',
      entityId: settings._id,
      description: `First-run system setup completed for ${companyName} by ${adminName}`,
      after: { companyName, adminEmail },
    });

    const token = generateToken(adminUser._id);

    res.status(201).json({
      success: true,
      message: 'First-run setup completed successfully!',
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        mustChangePassword: false,
      },
      settings,
    });
  } catch (error) {
    console.error('Setup Controller Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
