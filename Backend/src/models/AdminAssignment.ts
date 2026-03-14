import { Schema, model } from 'mongoose';

const adminAssignmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    competitionLevel: {
      type: String,
      enum: ['sub_county', 'county', 'regional', 'national', 'global'],
      required: true,
      default: 'global',
    },
    region: { type: String, trim: true, default: '' },
    county: { type: String, trim: true, default: '' },
    subCounty: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AdminAssignmentModel = model('AdminAssignment', adminAssignmentSchema);
