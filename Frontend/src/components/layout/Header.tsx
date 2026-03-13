'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, MoonStar, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { logout } from '@/lib/api';
import { applyTheme, getPreferredTheme, ThemeMode, toggleThemeMode } from '@/lib/theme';
import { BackButton } from './BackButton';
import { Sidebar } from './Sidebar';

const roleTitle = {
  admin: 'Admin Dashboard',
  judge: 'Judge Dashboard',
  patron: 'Patron Dashboard',
} as const;

const roleFallback = {
  admin: '/admin/dashboard',
  judge: '/judge/dashboard',
  patron: '/patron/dashboard',
} as const;

export function Header({ role, userName = 'User', userEmail = 'user@example.com' }: { role: 'admin' | 'judge' | 'patron'; userName?: string; userEmail?: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    setTheme(getPreferredTheme());
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      router.replace('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = toggleThemeMode(theme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <header className="theme-app-header sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/90 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-200 hover:bg-white/5 lg:hidden"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-white/10 bg-slate-950 p-0"><Sidebar role={role} /></SheetContent>
        </Sheet>
        <BackButton fallbackHref={roleFallback[role]} className="hidden md:inline-flex" />
        <div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>KSEF Digital System</span>
            <Link href="/rankings" className="hover:text-white">Rankings</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200">{roleTitle[role]}</span>
          </div>
          <h2 className="font-semibold text-white">{userName}</h2>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <BackButton fallbackHref={roleFallback[role]} className="md:hidden" />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
          className="text-slate-200 hover:bg-white/5"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <SunMedium className="h-5 w-5" />
          ) : (
            <MoonStar className="h-5 w-5" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-200 hover:bg-white/5"><Bell className="h-5 w-5" /></Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={loggingOut}
          className="hidden text-slate-200 hover:bg-white/5 md:inline-flex"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? 'Signing out...' : 'Logout'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-slate-200 hover:bg-white/5 md:hidden"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
        <div className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:block">
          <p className="font-medium text-white">{userName}</p>
          <p className="text-xs text-slate-400">{userEmail}</p>
        </div>
      </div>
    </header>
  );
}
