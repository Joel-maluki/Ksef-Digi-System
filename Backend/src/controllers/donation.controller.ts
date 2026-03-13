import { Request, Response } from 'express';
import { env } from '../config/env';
import { DonationModel } from '../models/Donation';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

export const initiateDonation = async (req: Request, res: Response) => {
  const { donorPhone, amount } = req.body;
  if (!donorPhone || !amount) throw new ApiError(400, 'donorPhone and amount are required');
  const paymentReference = `KSEF-${Date.now()}`;
  const donation = await DonationModel.create({
    donorPhone,
    paybillNumber: env.donationPaybillNumber,
    accountNumber: env.donationAccountNumber,
    amount,
    paymentReference,
    paymentStatus: 'pending',
  });
  res.status(201).json(
    ok(
      {
        donation,
        message: `Pay KES ${Number(amount).toLocaleString()} via M-Pesa Paybill ${env.donationPaybillNumber} using account ${env.donationAccountNumber}, then share the payment confirmation with admin for verification.`,
      },
      'Donation recorded'
    )
  );
};

export const listDonations = async (_req: Request, res: Response) => {
  const donations = await DonationModel.find().sort({ createdAt: -1 });
  res.json(ok(donations));
};

export const getDonation = async (req: Request, res: Response) => {
  const donation = await DonationModel.findById(req.params.id);
  if (!donation) throw new ApiError(404, 'Donation not found');
  res.json(ok(donation));
};

export const updateDonationStatus = async (req: Request, res: Response) => {
  const donation = await DonationModel.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus }, { new: true, runValidators: true });
  if (!donation) throw new ApiError(404, 'Donation not found');
  res.json(ok(donation, 'Donation status updated'));
};
