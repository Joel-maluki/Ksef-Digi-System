'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { me } from './api';
import type { StoredUser } from './auth';

const roleHome: Record<StoredUser['role'], string> = {
  admin: '/admin/dashboard',
  judge: '/judge/dashboard',
  patron: '/patron/dashboard',
};

const getRequiredRole = (pathname: string): StoredUser['role'] | null => {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/judge')) return 'judge';
  if (pathname.startsWith('/patron')) return 'patron';
  return null;
};

export function useRequireAuth(options?: { allowPendingPasswordChange?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const currentUser = await me();
        const requiredRole = getRequiredRole(pathname);

        if (!currentUser) {
          setUser(null);
          router.replace('/login');
          return;
        }

        if (
          currentUser?.mustChangePassword &&
          !options?.allowPendingPasswordChange &&
          pathname !== '/set-password'
        ) {
          setUser(currentUser);
          router.replace('/set-password');
          return;
        }

        if (requiredRole && currentUser?.role !== requiredRole) {
          setUser(null);
          router.replace(roleHome[currentUser.role] || '/login');
          return;
        }

        setUser(currentUser);
      } catch (err) {
        setUser(null);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [options?.allowPendingPasswordChange, pathname, router]);

  return { loading, user };
}
