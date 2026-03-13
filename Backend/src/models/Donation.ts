import { Schema, model } from 'mongoose';

const donationSchema = new Schema(
  {
    donorPhone: { type: String, required: true },
    recipientPhone: { type: String, trim: true, default: '' },
    paybillNumber: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    amount: { type: Number, required: true, min: 1 },
    paymentReference: { type: String, required: true },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  },
  { timestamps: true }
);

export const DonationModel = model('Donation', donationSchema);
