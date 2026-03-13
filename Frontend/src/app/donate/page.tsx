'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, HeartHandshake, PhoneCall, Wallet } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackendPublicSummary, createDonation, getPublicSummary } from '@/lib/api';

const presetAmounts = [500, 1000, 2500, 5000, 10000];
const donationPaybillNumber = '522522';
const donationAccountNumber = '1199328480';

const emptySummary: BackendPublicSummary = {
  schools: 0,
  projects: 0,
  categories: 0,
  donationsTotal: 0,
};

const normalizeKenyanPhone = (value: string) => value.replace(/\s+/g, '').trim();

export default function DonatePage() {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [summary, setSummary] = useState<BackendPublicSummary>(emptySummary);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setSummary(await getPublicSummary());
      } catch {
        setSummary(emptySummary);
      }
    };

    load();
  }, []);

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => {
        setCopiedField((current) => (current === label ? null : current));
      }, 1800);
    } catch {
      setStatus('failed');
      setMessage(`Unable to copy ${label.toLowerCase()} right now.`);
    }
  };

  const handleDonate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const parsedAmount = Number(amount);
    const normalizedPhone = normalizeKenyanPhone(phone);

    if (!normalizedPhone || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setStatus('failed');
      setMessage('Enter a valid Kenyan phone number and donation amount.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await createDonation({
        donorPhone: normalizedPhone,
        amount: parsedAmount,
      });

      setStatus('pending');
      setMessage(
        response.message ||
          (response.donation?.paymentReference
            ? `Donation recorded. Reference: ${response.donation.paymentReference}. Pay via paybill ${
                response.donation.paybillNumber || donationPaybillNumber
              } using account ${response.donation.accountNumber || donationAccountNumber}.`
            : 'Donation recorded successfully.')
      );
      setAmount('');
      setPhone('');

      try {
        setSummary(await getPublicSummary());
      } catch {
        // Ignore summary refresh errors after successful initiation.
      }
    } catch (err: unknown) {
      setStatus('failed');
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PublicHeader />

      <section className="home-hero-scene relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
              <HeartHandshake className="h-4 w-4" />
              Support student innovation
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Help move KSEF projects from school ideas to competition-day reality.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Well-wishers can support project materials, event-day logistics, travel and
              student participation through the public donation page.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['Schools in the fair', summary.schools],
                ['Projects submitted', summary.projects],
                ['Funds raised', `KES ${summary.donationsTotal.toLocaleString()}`],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
                >
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-200">
                Donate via M-Pesa
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Send support to the fair
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Enter your preferred contribution amount and your contact number, then
                send the donation to the official fair recipient below.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-blue-200">
                M-Pesa paybill details
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paybill</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-2xl font-semibold text-white">{donationPaybillNumber}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy('Paybill', donationPaybillNumber)}
                      className="rounded-xl border-white/10 bg-white/5 text-slate-200"
                    >
                      {copiedField === 'Paybill' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Account</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-2xl font-semibold text-white">{donationAccountNumber}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy('Account', donationAccountNumber)}
                      className="rounded-xl border-white/10 bg-white/5 text-slate-200"
                    >
                      {copiedField === 'Account' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Open M-Pesa, choose <span className="font-semibold text-white">Lipa na M-Pesa</span>,
                then <span className="font-semibold text-white">Paybill</span>, and use these details.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                This paybill flow does not create an automatic M-Pesa popup from the website.
              </p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleDonate}>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Preset amounts</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className={`rounded-2xl border px-4 py-3 text-sm transition ${
                        amount === String(preset)
                          ? 'border-blue-400/40 bg-blue-500/20 text-blue-100'
                          : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      KES {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Amount (KES)</label>
                  <Input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="e.g. 1000"
                    inputMode="numeric"
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Your phone number</label>
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="e.g. 0712345678 or 254712345678"
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                After you submit, the system records your donation request and shows a
                reference. Then pay the selected amount via paybill {donationPaybillNumber}
                using account {donationAccountNumber}, and share the M-Pesa confirmation
                with admin if verification is needed.
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500"
              >
                {loading ? 'Sending request...' : 'Donate now'}
              </Button>
            </form>

            {status && message ? (
              <div
                className={`mt-5 rounded-2xl border p-4 text-sm ${
                  status === 'pending'
                    ? 'border-blue-400/20 bg-blue-500/10 text-blue-100'
                    : 'border-red-400/20 bg-red-500/10 text-red-200'
                }`}
              >
                {message}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: 'Project support',
              copy: 'Help learners buy materials, refine prototypes and prepare displays.',
            },
            {
              icon: PhoneCall,
              title: 'Competition logistics',
              copy: 'Support venue preparation, coordination and movement during fair days.',
            },
            {
              icon: HeartHandshake,
              title: 'Student opportunity',
              copy: 'Make it easier for deserving projects to reach county, regionals and nationals.',
            },
          ].map((item) => (
            <div key={item.title} className="surface p-6">
              <item.icon className="h-6 w-6 text-blue-300" />
              <h2 className="mt-4 text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="surface flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-blue-200">
              Need another public page?
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Continue with rankings, announcements or school registration
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href="/rankings">View rankings</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href="/register-school">Register school</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
