import mongoose from 'mongoose';

const orgSettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      default: 'Saylani HCM Inc.',
    },
    companyEmail: {
      type: String,
      trim: true,
    },
    officeHours: {
      start: { type: String, default: '09:00' }, // 24hr format HH:mm
      end: { type: String, default: '18:00' },
      graceMinutes: { type: Number, default: 15 }, // late after 09:15
      halfDayHours: { type: Number, default: 5 }, // under 5h is half-day
    },
    weekendDays: {
      type: [String],
      default: ['Saturday', 'Sunday'], // Weekend days
    },
    location: {
      address: { type: String, default: 'Zaitoon Ashraf IT Park' },
      latitude: { type: Number, default: 24.8607 },
      longitude: { type: Number, default: 67.0011 },
      radiusMeters: { type: Number, default: 150 }, // Geofence radius
    },
    latePenaltyRule: {
      type: Boolean,
      default: true, // Bonus rule: 3 lates = 0.5 day salary deduction
    },
    isSetupComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const OrgSettings = mongoose.model('OrgSettings', orgSettingsSchema);
export default OrgSettings;
