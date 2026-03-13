'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendDonation,
  listDonations,
  updateDonationStatus,
} from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function AdminDonationsPage() {
  const { loading: authLoading } = useRequireAuth();
  const [donations, setDonations] = useState<BackendDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDonations = async () => {
    setLoading(true);
    setError(null);

    try {
      setDonations(await listDonations());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadDonations();
    }
  }, [authLoading]);

  const totals = useMemo(() => {
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const successAmount = donations
      .filter((donation) => donation.paymentStatus === 'success')
      .reduce((sum, donation) => sum + donation.amount, 0);

    return {
      totalAmount,
      successAmount,
      pendingCount: donations.filter((donation) => donation.paymentStatus === 'pending').length,
    };
  }, [donations]);

  const handleStatusUpdate = async (
    id: string,
    paymentStatus: 'pending' | 'success' | 'failed'
  ) => {
    setUpdatingId(id);
    setError(null);

    try {
      await updateDonationStatus(id, paymentStatus);
      await loadDonations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Donations</h1>
          <p className="section-copy mt-2">
            Review all donation attempts and update pending payment states when needed.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface p-5">
            <p className="text-sm text-slate-300">All donations</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              KES {totals.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="surface p-5">
            <p className="text-sm text-slate-300">Successful donations</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              KES {totals.successAmount.toLocaleString()}
            </p>
          </div>
          <div className="surface p-5">
            <p className="text-sm text-slate-300">Pending payments</p>
            <p className="mt-2 text-3xl font-semibold text-white">{totals.pendingCount}</p>
          </div>
        </div>

        {error ? <div className="surface p-4 text-sm text-red-300">{error}</div> : null}

        <div className="surface overflow-hidden">
          {authLoading || loading ? (
            <div className="px-4 py-6 text-slate-300">Loading donations...</div>
          ) : donations.length === 0 ? (
            <div className="px-4 py-6 text-slate-300">No donations have been recorded yet.</div>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {donations.map((donation) => (
                  <div
                    key={donation._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{donation.donorPhone}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          KES {donation.amount.toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`status-badge ${
                          donation.paymentStatus === 'success'
                            ? 'bg-green-500/20 text-green-100'
                            : donation.paymentStatus === 'failed'
                              ? 'bg-red-500/20 text-red-100'
                              : 'bg-amber-500/20 text-amber-100'
                        }`}
                      >
                        {donation.paymentStatus}
                      </span>
                    </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Reference
                          </p>
                        <p className="mt-1 text-sm text-slate-200">
                          {donation.paymentReference}
                        </p>
                      </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Created
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {new Date(donation.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Paybill
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {donation.paybillNumber || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Account
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {donation.accountNumber || donation.recipientPhone || '-'}
                          </p>
                        </div>
                      </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={updatingId === donation._id}
                        onClick={() => handleStatusUpdate(donation._id, 'success')}
                        className="rounded-xl border border-green-400/20 bg-green-500/10 px-3 py-2 text-xs text-green-200 disabled:opacity-60"
                      >
                        Mark Success
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === donation._id}
                        onClick={() => handleStatusUpdate(donation._id, 'failed')}
                        className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 disabled:opacity-60"
                      >
                        Mark Failed
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[860px] text-sm">
                  <thead className="bg-white/5 text-left text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Paybill</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((donation) => (
                      <tr key={donation._id} className="border-t border-white/10">
                        <td className="px-4 py-3 text-white">{donation.donorPhone}</td>
                        <td className="px-4 py-3 text-slate-300">
                          KES {donation.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{donation.paymentReference}</td>
                        <td className="px-4 py-3 text-slate-300">{donation.paybillNumber || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {donation.accountNumber || donation.recipientPhone || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`status-badge ${
                              donation.paymentStatus === 'success'
                                ? 'bg-green-500/20 text-green-100'
                                : donation.paymentStatus === 'failed'
                                  ? 'bg-red-500/20 text-red-100'
                                  : 'bg-amber-500/20 text-amber-100'
                            }`}
                          >
                            {donation.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {new Date(donation.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={updatingId === donation._id}
                              onClick={() => handleStatusUpdate(donation._id, 'success')}
                              className="rounded-xl border border-green-400/20 bg-green-500/10 px-3 py-2 text-xs text-green-200 disabled:opacity-60"
                            >
                              Mark Success
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === donation._id}
                              onClick={() => handleStatusUpdate(donation._id, 'failed')}
                              className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 disabled:opacity-60"
                            >
                              Mark Failed
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
