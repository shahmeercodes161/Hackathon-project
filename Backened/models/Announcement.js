import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal',
    },
    postedBy: {
      type: String, // Author name
      required: true,
    },
    postedByRole: {
      type: String, // 'admin' or 'hr'
      required: true,
    },
  },
  { timestamps: true }
);

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
