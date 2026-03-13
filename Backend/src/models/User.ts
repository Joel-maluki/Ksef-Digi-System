import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'patron', 'judge'], required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    trainedJudge: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, schoolId: 1 }, { unique: true, partialFilterExpression: { role: 'patron' } });

export const UserModel = model('User', userSchema);
