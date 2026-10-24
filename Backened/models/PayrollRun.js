import mongoose from 'mongoose';

const payrollRunSchema = new mongoose.Schema(
  {
    month: {
      type: String, // YYYY-MM
      required: true,
      unique: true,
    },
    totalEmployees: {
      type: Number,
      default: 0,
    },
    totalGross: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    totalNet: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft',
    },
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);
export default PayrollRun;
