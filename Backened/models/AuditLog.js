import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    action: {
      type: String, // 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'FINALIZE', 'LOGIN', 'RESET_PASSWORD'
      required: true,
    },
    entity: {
      type: String, // 'Company', 'Employee', 'Attendance', 'Leave', 'Payroll', 'User', 'Department'
      required: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
