'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { forgotPassword } from '@/lib/api';

const allowedRoles = ['admin', 'judge', 'patron'] as const;

function ForgotPasswordPageContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role');
  const [role, setRole] = useState<'admin' | 'judge' | 'patron'>('admin');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialRole && allowedRoles.includes(initialRole as 'admin' | 'judge' | 'patron')) {
      setRole(initialRole as 'admin' | 'judge' | 'patron');
    }
  }, [initialRole]);

  const identifierLabel = useMemo(
    () =>
      role === 'admin'
        ? 'Admin Email or Username'
        : role === 'patron'
        ? 'School Username or Patron Email'
        : 'Judge Email or Username',
    [role]
  );

  const helperCopy = useMemo(
    () =>
      role === 'admin'
        ? 'Enter the admin email or username, plus the phone number stored on the admin account.'
        : role === 'patron'
        ? 'Enter the school username or patron email, plus the phone number stored on the patron account.'
        : 'Enter the judge email or username, plus the phone number stored on the judge account.',
    [role]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await forgotPassword({
        role,
        identifier: identifier.trim(),
        phone: phone.trim(),
      });

      setSuccess(
        response.message ||
          'If the account details matched, a temporary password has been sent by SMS.'
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PublicHeader />
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="surface w-full max-w-xl p-2">
          <CardHeader>
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
              <KeyRound className="h-4 w-4" /> Password recovery
            </div>
            <CardTitle className="text-3xl text-white">Forgot Password</CardTitle>
            <p className="text-sm text-slate-400">
              Admins, judges, and patrons can request a temporary password by verifying
              the phone number stored on the account.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Account Type</label>
                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
                  {allowedRoles.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRole(item)}
                      className={`rounded-xl px-3 py-2 text-sm capitalize transition ${
                        role === item ? 'bg-blue-600 text-white' : 'text-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">{identifierLabel}</label>
                <Input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Enter your login identifier"
                  className="border-white/10 bg-white/5 text-white"
                />
                <p className="mt-2 text-xs text-slate-400">{helperCopy}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Registered Phone Number</label>
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0712345678"
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500"
              >
                {loading ? 'Sending reset SMS...' : 'Send Temporary Password'}
              </Button>

              <p className="text-center text-sm text-slate-400">
                Back to{' '}
                <Link href="/login" className="text-blue-200 hover:text-white">
                  login
                </Link>
                .
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <PublicHeader />
          <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <Card className="surface w-full max-w-xl p-2">
              <CardContent className="p-6 text-sm text-slate-300">
                Loading password recovery...
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
