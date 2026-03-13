'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateMyPassword } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

const roleTargets = {
  admin: '/admin/dashboard',
  judge: '/judge/dashboard',
  patron: '/patron/dashboard',
} as const;

export default function SetPasswordPage() {
  const router = useRouter();
  const { loading: authLoading, user } = useRequireAuth({
    allowPendingPasswordChange: true,
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && !user.mustChangePassword) {
      router.replace(roleTargets[user.role] ?? '/');
    }
  }, [authLoading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword) {
      setError('Current password and new password are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);

    try {
      const result = await updateMyPassword(currentPassword, newPassword);

      if (!result.success || !result.user) {
        setError('Unable to update password.');
        return;
      }

      router.replace(roleTargets[result.user.role] ?? '/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const layoutRole =
    user?.role === 'admin' || user?.role === 'judge' ? user.role : 'patron';

  return (
    <DashboardLayout role={layoutRole}>
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="section-title">Create Your Password</h1>
          <p className="section-copy mt-2">
            Use this page after a first login or after signing in with a temporary reset
            password. Set the final password before continuing into the system.
          </p>
        </div>

        {authLoading ? (
          <div className="surface p-6 text-slate-300">Loading password setup...</div>
        ) : (
          <form className="surface space-y-5 p-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="border-white/10 bg-white/5 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="border-white/10 bg-white/5 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="border-white/10 bg-white/5 text-white"
              />
            </div>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500"
            >
              {saving ? 'Saving...' : 'Save New Password'}
            </Button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
