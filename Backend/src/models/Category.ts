import { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CategoryModel = model('Category', categorySchema);
