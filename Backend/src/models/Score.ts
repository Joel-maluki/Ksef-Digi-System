import { Schema, model } from 'mongoose';

const scoreSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sectionA: { type: Number, required: true, min: 0, max: 30 },
    sectionB: { type: Number, required: true, min: 0, max: 15 },
    sectionC: { type: Number, required: true, min: 0, max: 35 },
    judgeTotal: { type: Number, required: true },
    locked: { type: Boolean, default: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

scoreSchema.index({ projectId: 1, judgeId: 1 }, { unique: true });

export const ScoreModel = model('Score', scoreSchema);
