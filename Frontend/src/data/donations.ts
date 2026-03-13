import type { Donation } from './types';

export const donationGoal = 300000;

export const donations: Donation[] = [
  { id: 'don-1', donorName: 'Anonymous', amount: 5000, message: 'Support girls in STEM', createdAt: '2026-03-02T10:00:00Z', isAnonymous: true },
  { id: 'don-2', donorName: 'Former Students Association', amount: 25000, message: 'For fair logistics', createdAt: '2026-03-03T09:20:00Z', isAnonymous: false },
  { id: 'don-3', donorName: 'Well Wisher', amount: 15000, message: 'Keep building this system', createdAt: '2026-03-04T11:40:00Z', isAnonymous: false },
];

export function getTotalDonations() {
  return donations.reduce((sum, item) => sum + item.amount, 0);
}
