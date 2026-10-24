import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    joiningDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'probation', 'resigned', 'terminated'],
      default: 'active',
    },
    exitDate: {
      type: String, // YYYY-MM-DD if resigned/terminated
      default: null,
    },
    salaryStructure: {
      basic: { type: Number, required: true, min: 0 },
      hra: { type: Number, default: 0 }, // 40% of basic
      medical: { type: Number, default: 0 }, // 10% of basic
      gross: { type: Number, default: 0 }, // 1.5 * basic
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    faceDescriptor: {
      type: [Number], // Optional enrolled face embedding vector for bonus
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook to compute fullName and salary breakdown
employeeSchema.pre('save', function () {
  this.fullName = `${this.firstName} ${this.lastName}`.trim();
  if (this.salaryStructure && this.salaryStructure.basic) {
    const basic = Number(this.salaryStructure.basic);
    this.salaryStructure.hra = Math.round(basic * 0.4);
    this.salaryStructure.medical = Math.round(basic * 0.1);
    this.salaryStructure.gross = Math.round(basic * 1.5);
  }
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
