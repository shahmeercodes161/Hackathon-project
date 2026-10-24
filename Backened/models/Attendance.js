import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    workHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'half_day', 'missing_checkout', 'absent'],
      default: 'present',
    },
    source: {
      type: String,
      enum: ['web', 'camera'],
      default: 'web',
    },
    locationData: {
      latitude: Number,
      longitude: Number,
      accuracyMeters: Number,
      distanceFromOfficeMeters: Number,
      isWithinOfficeRadius: Boolean,
    },
    faceVerified: {
      type: Boolean,
      default: false,
    },
    correctionRequest: {
      hasRequested: { type: Boolean, default: false },
      requestedCheckIn: Date,
      requestedCheckOut: Date,
      reason: String,
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      hrComment: String,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
    },
  },
  { timestamps: true }
);

// Unique index: One attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
