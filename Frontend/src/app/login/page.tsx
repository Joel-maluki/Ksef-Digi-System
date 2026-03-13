'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/api';

const roleTargets = {
  admin: '/admin/dashboard',
  judge: '/judge/dashboard',
  patron: '/patron/dashboard',
} as const;

const levels = ['Sub-County', 'County', 'Regional', 'National'];

const roleHints = {
  admin: 'Use email or username, for example `admin@ksef.ke` or `admin`.',
  patron: 'Use the school username created during registration, or the patron email on file.',
  judge: 'Use your judge email or username to access scoring.',
} as const;

export default function LoginPage() {
  const [role, setRole] = useState<keyof typeof roleTargets>('admin');
  const [level, setLevel] = useState('Sub-County');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const identifierLabel = useMemo(
    () =>
      role === 'admin'
        ? 'Admin Email or Username'
        : role === 'patron'
          ? 'School Username or Patron Email'
          : 'Email or Username',
    [role]
  );

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await login(identifier, password);

      if (!resp.success || !resp.user) {
        setError('Invalid credentials');
        return;
      }

      if (resp.user.role !== role) {
        setError(`This account is registered as ${resp.user.role}, not ${role}.`);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('ksef-level', level);
      }

      if (resp.user.mustChangePassword) {
        router.push('/set-password');
        return;
      }

      router.push(roleTargets[resp.user.role] ?? '/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || 'Unable to login');
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
              <ShieldCheck className="h-4 w-4" /> Secure role-based access
            </div>
            <CardTitle className="text-3xl text-white">Login to KSEF System</CardTitle>
            <p className="text-sm text-slate-400">
              Sign in with your KSEF account to access the dashboard.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Select Role</label>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
                    {(['admin', 'patron', 'judge'] as const).map((item) => (
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
                  <label className="mb-2 block text-sm text-slate-300">
                    Competition Level
                  </label>
                  <select
                    value={level}
                    onChange={(event) => setLevel(event.target.value)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                  >
                    {levels.map((item) => (
                      <option key={item} value={item} className="bg-slate-900">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    {identifierLabel}
                  </label>
                  <Input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="Enter your email or username"
                    className="border-white/10 bg-white/5 text-white"
                  />
                  <p className="mt-2 text-xs text-slate-400">{roleHints[role]}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Password</label>
                  <Input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    placeholder="Enter your password"
                    className="border-white/10 bg-white/5 text-white"
                  />
                  {role !== 'admin' ? (
                    <div className="mt-2 text-right">
                      <Link
                        href={`/forgot-password?role=${role}`}
                        className="text-xs text-blue-200 hover:text-white"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500"
              >
                {loading ? 'Signing in...' : 'Login'}
              </Button>

              {role === 'patron' ? (
                <p className="text-center text-sm text-slate-400">
                  New school patron?{' '}
                  <Link href="/register-school" className="text-blue-200 hover:text-white">
                    Register your school account
                  </Link>
                  .
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
