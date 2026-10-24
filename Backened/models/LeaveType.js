import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    quota: {
      type: Number,
      required: true,
      default: 10,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    isUnlimited: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);
export default LeaveType;
