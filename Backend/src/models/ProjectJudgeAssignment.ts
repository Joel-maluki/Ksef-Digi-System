import { Schema, model } from 'mongoose';

const projectJudgeAssignmentSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    assignedBy: { type: String, enum: ['system', 'admin'], default: 'system' },
    assignmentStatus: { type: String, enum: ['assigned', 'completed', 'removed'], default: 'assigned' },
    conflictFlag: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectJudgeAssignmentSchema.index({ projectId: 1, judgeId: 1 }, { unique: true });

export const ProjectJudgeAssignmentModel = model('ProjectJudgeAssignment', projectJudgeAssignmentSchema);
