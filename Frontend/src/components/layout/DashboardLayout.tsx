'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { getStoredUser } from '@/lib/auth';

export function DashboardLayout({ children, role, userName, userEmail }: { children: React.ReactNode; role: 'admin' | 'judge' | 'patron'; userName?: string; userEmail?: string }) {
  const [storedUser, setStoredUser] = useState<{ fullName: string; email: string } | null>(null);

  useEffect(() => {
    if (!userName || !userEmail) {
      const user = getStoredUser();
      if (user) {
        setStoredUser({ fullName: user.fullName, email: user.email });
      }
    }
  }, [userName, userEmail]);

  const displayName = userName || storedUser?.fullName || 'User';
  const displayEmail = userEmail || storedUser?.email || 'user@example.com';

  const headerProps = useMemo(
    () => ({ role, userName: displayName, userEmail: displayEmail }),
    [role, displayName, displayEmail]
  );

  return (
    <div className="theme-dashboard-shell relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="admin-area-scene absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen">
        <div className="hidden lg:block"><Sidebar role={role} /></div>
        <div className="flex flex-1 flex-col">
          <Header {...headerProps} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
