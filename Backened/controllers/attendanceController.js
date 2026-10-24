import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import OrgSettings from '../models/OrgSettings.js';
import { evaluateCheckInStatus, verifyGeofence, calculateWorkHours } from '../services/attendanceService.js';
import { logAudit } from '../services/auditService.js';

/**
 * @route   POST /api/attendance/check-in
 * @desc    Web or Camera check-in (Server stamps time; 409 if already checked in)
 */
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.role === 'employee' ? req.user.employeeId : req.body.employeeId || req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No associated employee record found for check-in' });
    }

    const now = new Date();
    // Use PKT (UTC+5) for date string so attendance date matches Pakistan local date
    const pktOffset = 5 * 60 * 60 * 1000;
    const pktNow = new Date(now.getTime() + pktOffset);
    const dateStr = pktNow.toISOString().split('T')[0];

    // Check if already checked in today -> 409 Conflict as specified in brief
    const existing = await Attendance.findOne({ employeeId, date: dateStr });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Already checked in for today! Multiple check-ins on the same day are not permitted.',
        attendance: existing,
      });
    }

    const settings = await OrgSettings.findOne().lean() || {
      officeHours: { start: '09:00', graceMinutes: 15, halfDayHours: 5 },
      location: { latitude: 24.8607, longitude: 67.0011, radiusMeters: 150 },
    };

    const source = req.body.source === 'camera' ? 'camera' : 'web';
    let locationData = null;
    let faceVerified = false;

    // Optional Camera + Geofence Verification (Bonus +10 pts)
    if (source === 'camera') {
      const { latitude, longitude, accuracy, faceDetected } = req.body;

      if (!faceDetected) {
        return res.status(400).json({
          success: false,
          message: 'Face detection failed: Exactly one face must be present in the camera frame.',
        });
      }
      faceVerified = true;

      if (accuracy && accuracy > 100) {
        return res.status(400).json({
          success: false,
          message: `GPS accuracy too weak (${Math.round(accuracy)}m). Requires accuracy within 100m.`,
        });
      }

      if (latitude && longitude) {
        const geoResult = verifyGeofence({ latitude, longitude, accuracy }, settings.location);
        locationData = {
          latitude,
          longitude,
          accuracyMeters: accuracy || 10,
          distanceFromOfficeMeters: geoResult.distanceMeters,
          isWithinOfficeRadius: geoResult.isWithinOfficeRadius,
        };

        if (!geoResult.isWithinOfficeRadius) {
          return res.status(400).json({
            success: false,
            message: `Geofence check failed: You are ${geoResult.distanceMeters}m away from the office (Allowed radius: ${geoResult.radius}m).`,
            locationData,
          });
        }
      }
    }

    // Determine Status (present vs late based on 09:15 cutoff)
    const initialStatus = evaluateCheckInStatus(
      now,
      settings.officeHours?.start || '09:00',
      settings.officeHours?.graceMinutes ?? 15
    );

    const attendance = await Attendance.create({
      employeeId,
      date: dateStr,
      checkIn: now,
      status: initialStatus,
      source,
      locationData,
      faceVerified,
    });

    const emp = await Employee.findById(employeeId).select('fullName employeeCode department');

    await logAudit({
      req,
      action: 'CREATE',
      entity: 'Attendance',
      entityId: attendance._id,
      description: `Check-in recorded for ${emp?.fullName || employeeId} (${initialStatus.toUpperCase()}, source: ${source})`,
    });

    res.status(201).json({
      success: true,
      message: `Checked in successfully as '${initialStatus}'. Server timestamp recorded.`,
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Already checked in for today! Duplicate check-in is not permitted.',
      });
    }
    console.error('Check-in Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/attendance/check-out
 * @desc    Web check-out (Computes workHours; under 5h becomes half_day)
 */
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.role === 'employee' ? req.user.employeeId : req.body.employeeId || req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No associated employee record found' });
    }

    const now = new Date();
    const pktOffset = 5 * 60 * 60 * 1000;
    const pktNow = new Date(now.getTime() + pktOffset);
    const dateStr = pktNow.toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ employeeId, date: dateStr });
    if (!attendance) {
      return res.status(400).json({ success: false, message: 'No check-in record found for today. Please check in first.' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'Already checked out for today.' });
    }

    const settings = await OrgSettings.findOne().lean() || { officeHours: { halfDayHours: 5 } };
    const halfDayThreshold = settings.officeHours?.halfDayHours || 5;

    attendance.checkOut = now;
    const hours = calculateWorkHours(attendance.checkIn, now);
    attendance.workHours = hours;

    // Rule: half_day under 5 hours
    if (hours < halfDayThreshold) {
      attendance.status = 'half_day';
    }

    await attendance.save();

    res.json({
      success: true,
      message: `Checked out successfully. Logged ${hours} hours. Status: '${attendance.status}'`,
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/attendance/today
 * @desc    Get current day's attendance status for logged-in user
 */
export const getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.json({ success: true, attendance: null, message: 'Admin account has no direct attendance card' });
    }

    const pktOffset = 5 * 60 * 60 * 1000;
    const todayStr = new Date(Date.now() + pktOffset).toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ employeeId, date: todayStr }).lean();

    res.json({ success: true, attendance: attendance || null, today: todayStr });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/attendance/board
 * @desc    Daily attendance board for Admin & HR (and own calendar for employee)
 */
export const getDailyBoard = async (req, res) => {
  try {
    const pktOffset = 5 * 60 * 60 * 1000;
    const todayStr = new Date(Date.now() + pktOffset).toISOString().split('T')[0];
    const { date = todayStr, department } = req.query;

    const empFilter = { status: { $in: ['active', 'probation'] } };
    if (department && department !== 'All') {
      empFilter.department = department;
    }

    // Role scope
    if (req.user.role === 'employee') {
      empFilter._id = req.user.employeeId;
    }

    const employees = await Employee.find(empFilter).select('employeeCode fullName department designation').lean();
    const empIds = employees.map((e) => e._id);

    const attendances = await Attendance.find({ employeeId: { $in: empIds }, date }).lean();
    const attMap = new Map();
    attendances.forEach((a) => attMap.set(String(a.employeeId), a));

    const board = employees.map((emp) => {
      const att = attMap.get(String(emp._id));
      return {
        employee: emp,
        attendance: att || {
          date,
          status: 'absent',
          checkIn: null,
          checkOut: null,
          workHours: 0,
        },
      };
    });

    res.json({
      success: true,
      date,
      totalEmployees: employees.length,
      board,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/attendance/history/:employeeId?
 * @desc    Get monthly attendance records for an employee
 */
export const getAttendanceHistory = async (req, res) => {
  try {
    let targetEmployeeId = req.params.employeeId || req.user.employeeId;

    if (req.user.role === 'employee') {
      targetEmployeeId = req.user.employeeId;
    }

    const { month } = req.query; // YYYY-MM
    const filter = { employeeId: targetEmployeeId };
    if (month) {
      filter.date = { $regex: `^${month}` };
    }

    const records = await Attendance.find(filter).sort({ date: -1 }).lean();
    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/attendance/correction/request
 * @desc    Employee requests attendance correction with reason
 */
export const requestCorrection = async (req, res) => {
  try {
    const { date, requestedCheckIn, requestedCheckOut, reason } = req.body;
    const employeeId = req.user.employeeId;

    if (!date || !reason) {
      return res.status(400).json({ success: false, message: 'Date and reason are required for correction' });
    }

    let record = await Attendance.findOne({ employeeId, date });
    if (!record) {
      // Create a shell record for this date
      record = new Attendance({
        employeeId,
        date,
        checkIn: requestedCheckIn ? new Date(requestedCheckIn) : new Date(`${date}T09:00:00Z`),
        status: 'absent',
        source: 'web',
      });
    }

    record.correctionRequest = {
      hasRequested: true,
      requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : record.checkIn,
      requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : record.checkOut,
      reason,
      status: 'pending',
    };

    await record.save();

    await logAudit({
      req,
      action: 'UPDATE',
      entity: 'Attendance',
      entityId: record._id,
      description: `Correction request submitted for date ${date}: ${reason}`,
    });

    res.json({ success: true, message: 'Attendance correction request submitted to HR', attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PATCH /api/attendance/correction/review/:id
 * @desc    HR approves or rejects attendance correction
 */
export const reviewCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, hrComment } = req.body; // action: 'approve' | 'reject'

    const record = await Attendance.findById(id);
    if (!record || !record.correctionRequest?.hasRequested) {
      return res.status(404).json({ success: false, message: 'Correction request not found' });
    }

    const before = record.toObject();

    if (action === 'approve') {
      record.checkIn = record.correctionRequest.requestedCheckIn || record.checkIn;
      record.checkOut = record.correctionRequest.requestedCheckOut || record.checkOut;
      const hours = calculateWorkHours(record.checkIn, record.checkOut);
      record.workHours = hours;
      record.status = hours >= 5 ? 'present' : 'half_day';
      record.correctionRequest.status = 'approved';
      record.correctionRequest.hrComment = hrComment || 'Approved by HR';
      record.correctionRequest.reviewedBy = req.user._id;
      record.correctionRequest.reviewedAt = new Date();
    } else {
      record.correctionRequest.status = 'rejected';
      record.correctionRequest.hrComment = hrComment || 'Rejected by HR';
      record.correctionRequest.reviewedBy = req.user._id;
      record.correctionRequest.reviewedAt = new Date();
    }

    await record.save();

    await logAudit({
      req,
      action: action === 'approve' ? 'APPROVE' : 'REJECT',
      entity: 'Attendance',
      entityId: record._id,
      description: `HR ${action}d attendance correction for date ${record.date}`,
      before,
      after: record,
    });

    res.json({ success: true, message: `Correction request ${action}d successfully`, attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
