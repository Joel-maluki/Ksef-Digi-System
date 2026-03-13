import { Schema, model } from 'mongoose';

const competitionScheduleEntrySchema = new Schema(
  {
    competitionLevel: {
      type: String,
      enum: ['sub_county', 'county', 'regional', 'national'],
      required: true,
    },
    scopeName: { type: String, required: true, trim: true },
    hostSchoolName: { type: String, required: true, trim: true },
    judgingStartDate: { type: Date, required: true },
    judgingEndDate: { type: Date, required: true },
    resultsAnnouncementDate: { type: Date, default: null },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'system' },
    activeCompetitionLevel: {
      type: String,
      enum: ['sub_county', 'county', 'regional', 'national'],
      default: 'sub_county',
    },
    projectSubmissionDeadline: { type: Date, default: null },
    scoreSubmissionDeadline: { type: Date, default: null },
    allowAdminRankingOverride: { type: Boolean, default: true },
    competitionSchedule: { type: [competitionScheduleEntrySchema], default: [] },
  },
  { timestamps: true }
);

export const SystemSettingModel = model('SystemSetting', systemSettingSchema);
