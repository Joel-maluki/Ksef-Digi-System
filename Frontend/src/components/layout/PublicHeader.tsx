'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, MoonStar, SunMedium, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { applyTheme, getPreferredTheme, ThemeMode, toggleThemeMode } from '@/lib/theme';
import { BackButton } from './BackButton';
import { BrandLogo } from './BrandLogo';

const links = [
  { href: '/', label: 'Home' },
  { href: '/donate', label: 'Donate' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/register-school', label: 'Register School' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const showBackButton = pathname !== '/';

  useEffect(() => {
    setTheme(getPreferredTheme());
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = toggleThemeMode(theme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <header className="theme-public-header sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {showBackButton ? <BackButton fallbackHref="/" className="shrink-0" /> : null}
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="xs" showWordmark={false} className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">KSEF Digi System</p>
              <p className="truncate text-xs text-slate-400">
                Developed by Ngao Girls High School
              </p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={cn('rounded-xl px-4 py-2 text-sm transition-colors', pathname === link.href ? 'bg-blue-500/20 text-blue-200' : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
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
          <Button
            variant="outline"
            asChild
            className="border-blue-400/20 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20 hover:text-white"
          >
            <Link href="/donate">Donate</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <Link href="/register-school">Register School</Link>
          </Button>
          <Button variant="ghost" asChild className="text-slate-200 hover:bg-white/5 hover:text-white"><Link href="/login">Login</Link></Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
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
          <button onClick={() => setOpen((v) => !v)} className="text-slate-200">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/10 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {showBackButton ? <BackButton fallbackHref="/" className="justify-start" /> : null}
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
                {link.label}
              </Link>
            ))}
            <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-500"><Link href="/login">Login</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}
