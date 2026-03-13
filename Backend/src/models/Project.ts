import { Schema, model } from 'mongoose';

const studentSchema = new Schema(
  {
    fullName: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    classForm: { type: String, required: true },
    schoolName: { type: String, required: true },
    subCounty: { type: String, required: true },
    county: { type: String, required: true },
    region: { type: String, required: true },
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    projectCode: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    mentorName: { type: String, required: true },
    mentorEmail: { type: String, trim: true, lowercase: true, default: '' },
    mentorPhone: { type: String, trim: true, default: '' },
    abstractPdfUrl: { type: String, default: '' },
    patronId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    currentLevel: {
      type: String,
      enum: ['sub_county', 'county', 'regional', 'national'],
      default: 'sub_county',
    },
    submissionStatus: {
      type: String,
      enum: ['draft', 'submitted', 'qualified', 'eliminated', 'published'],
      default: 'submitted',
    },
    qualifiedForNextLevel: { type: Boolean, default: false },
    students: {
      type: [studentSchema],
      validate: {
        validator: (value: unknown[]) => value.length >= 1 && value.length <= 2,
        message: 'Projects must have 1 or 2 students',
      },
    },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ProjectModel = model('Project', projectSchema);
