import mongoose from 'mongoose';

const aiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userRole: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String, // '/ai/chat', '/ai/summarize', '/ai/smart-leave'
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    toolsUsed: {
      type: [String],
      default: [],
    },
    response: {
      type: String,
      required: true,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    success: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const AiLog = mongoose.model('AiLog', aiLogSchema);
export default AiLog;
