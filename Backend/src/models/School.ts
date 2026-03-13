import { Schema, model } from 'mongoose';

const schoolSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    subCounty: { type: String, required: true },
    county: { type: String, required: true },
    region: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SchoolModel = model('School', schoolSchema);
