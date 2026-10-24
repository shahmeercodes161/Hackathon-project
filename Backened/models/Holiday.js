import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Holiday = mongoose.model('Holiday', holidaySchema);
export default Holiday;
