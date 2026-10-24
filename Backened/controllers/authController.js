import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { logAudit } from '../services/auditService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hackathon_default_secret_key_123', {
    expiresIn: '7d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Sign up new user with selected role (admin, hr, employee)
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'employee',
      department = 'General',
      designation = 'Staff Member',
      employeeCode,
      phone = '',
      basicSalary = 50000,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
    }

    const allowedRoles = ['admin', 'hr', 'employee'];
    const assignedRole = allowedRoles.includes(role) ? role : 'employee';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let employeeDoc = null;

    // For employee or HR roles, also provision or link an Employee profile so all portal modules work seamlessly
    if (assignedRole === 'employee' || assignedRole === 'hr') {
      const code = employeeCode
        ? employeeCode.toUpperCase().trim()
        : `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || 'Employee';
      const lastName = nameParts.slice(1).join(' ') || 'Member';

      const existingCode = await Employee.findOne({ employeeCode: code });
      const finalCode = existingCode ? `EMP-${Date.now().toString().slice(-4)}` : code;

      const basic = Number(basicSalary) || 50000;
      employeeDoc = await Employee.create({
        employeeCode: finalCode,
        firstName,
        lastName,
        fullName: name.trim(),
        email: cleanEmail,
        phone: phone || '',
        department: assignedRole === 'hr' ? (department || 'Human Resources') : (department || 'Engineering'),
        designation: assignedRole === 'hr' ? (designation || 'HR Specialist') : (designation || 'Associate'),
        joiningDate: new Date().toISOString().slice(0, 10),
        status: 'active',
        salaryStructure: {
          basic,
          hra: Math.round(basic * 0.4),
          medical: Math.round(basic * 0.1),
          gross: Math.round(basic * 1.5),
        },
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: assignedRole,
      employeeId: employeeDoc ? employeeDoc._id : null,
      mustChangePassword: false,
      isActive: true,
    });

    if (employeeDoc) {
      employeeDoc.userId = user._id;
      await employeeDoc.save();
    }

    const token = generateToken(user._id);

    await logAudit({
      actor: { id: user._id, name: user.name, email: user.email, role: user.role },
      action: 'REGISTER',
      entity: 'User',
      entityId: user._id,
      description: `New user registration: ${user.email} as ${user.role.toUpperCase()}`,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        employeeId: user.employeeId,
        employee: employeeDoc,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user, verify password, return JWT & flags
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact your administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    let employeeData = null;
    if (user.employeeId) {
      employeeData = await Employee.findById(user.employeeId).lean();
    }

    const token = generateToken(user._id);

    // Audit login
    await logAudit({
      actor: { id: user._id, name: user.name, email: user.email, role: user.role },
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      description: `User logged in: ${user.email} (${user.role})`,
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        employeeId: user.employeeId,
        employee: employeeData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let employeeData = null;
    if (user.employeeId) {
      employeeData = await Employee.findById(user.employeeId);
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        employeeId: user.employeeId,
        employee: employeeData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/auth/change-password
 * @desc    User changes password (especially for temporary password first sign-in)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);

    // If not first sign-in forced change, verify current password
    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'User',
      entityId: user._id,
      description: `Password updated for user: ${user.email}`,
    });

    res.json({
      success: true,
      message: 'Password updated successfully! You can now proceed to your dashboard.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/auth/create-hr
 * @desc    Admin creates an HR user account
 */
export const createHrUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const hrUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'hr',
      mustChangePassword: false,
      isActive: true,
    });

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'User',
      entityId: hrUser._id,
      description: `Admin created HR account: ${hrUser.email}`,
    });

    res.status(201).json({
      success: true,
      message: 'HR user account created successfully',
      user: {
        id: hrUser._id,
        name: hrUser.name,
        email: hrUser.email,
        role: hrUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/auth/users
 * @desc    Admin lists all user logins
 */
export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('employeeId', 'employeeCode fullName department designation').lean();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Admin resets password for any user
 */
export const resetUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, message: 'User ID and new password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = true; // Force them to change on next login
    await user.save();

    await logAudit({
      req,
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: user._id,
      description: `Admin reset password for user: ${user.email}`,
    });

    res.json({ success: true, message: `Password reset successfully for ${user.email}. Temporary password set.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PATCH /api/auth/toggle-status/:id
 * @desc    Admin deactivates or activates a user
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'User',
      entityId: user._id,
      description: `User ${user.email} status set to ${user.isActive ? 'Active' : 'Deactivated'}`,
    });

    res.json({ success: true, message: `User is now ${user.isActive ? 'Active' : 'Deactivated'}`, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
