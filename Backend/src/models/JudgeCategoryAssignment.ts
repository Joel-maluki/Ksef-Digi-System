import { Schema, model } from 'mongoose';

const judgeCategoryAssignmentSchema = new Schema(
  {
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

judgeCategoryAssignmentSchema.index({ judgeId: 1, categoryId: 1 }, { unique: true });

export const JudgeCategoryAssignmentModel = model('JudgeCategoryAssignment', judgeCategoryAssignmentSchema);
