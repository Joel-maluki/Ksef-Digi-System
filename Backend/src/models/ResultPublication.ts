import { Schema, model } from 'mongoose';

const resultPublicationSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    competitionLevel: {
      type: String,
      enum: ['sub_county', 'county', 'regional', 'national'],
      required: true,
    },
    published: { type: Boolean, default: false },
    forced: { type: Boolean, default: false },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

resultPublicationSchema.index({ categoryId: 1, competitionLevel: 1 }, { unique: true });

export const ResultPublicationModel = model('ResultPublication', resultPublicationSchema);
