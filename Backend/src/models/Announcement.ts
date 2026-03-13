import { Schema, model } from 'mongoose';

const announcementSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    published: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AnnouncementModel = model('Announcement', announcementSchema);
