'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  FolderKanban,
  HeartHandshake,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  School,
  Settings,
  Shapes,
  Trophy,
  Users,
} from 'lucide-react';
import { logout } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrandLogo } from './BrandLogo';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/schools', label: 'Schools', icon: School },
  { href: '/admin/categories', label: 'Categories', icon: Shapes },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/judges', label: 'Judges', icon: Users },
  { href: '/admin/scores', label: 'Scores', icon: ListChecks },
  { href: '/admin/rankings', label: 'Rankings', icon: Trophy },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/donations', label: 'Donations', icon: HeartHandshake },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const judgeLinks = [
  { href: '/judge/dashboard', label: 'My Assignments', icon: FolderKanban },
  { href: '/judge/submitted-scores', label: 'Submitted Scores', icon: Trophy },
];

const patronLinks = [
  { href: '/patron/dashboard', label: 'My Projects', icon: FolderKanban },
  { href: '/patron/submit-project', label: 'Submit Project', icon: LayoutDashboard },
];

export function Sidebar({ role }: { role: 'admin' | 'judge' | 'patron' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const links = role === 'admin' ? adminLinks : role === 'judge' ? judgeLinks : patronLinks;

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

  return (
    <aside className="theme-app-sidebar flex h-screen w-72 flex-col border-r border-white/10 bg-slate-950/95 px-4 py-5 text-slate-200">
      <Link
        href="/"
        className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <BrandLogo size="sm" showWordmark={false} className="shrink-0" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">KSEF Digi System</p>
          <p className="truncate text-xs capitalize text-slate-400">{role} portal</p>
        </div>
      </Link>
      <div className="space-y-1 overflow-y-auto">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors',
                active
                  ? 'bg-blue-500/20 text-blue-100'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-slate-200">
          <p className="font-medium text-white">Ngao Girls High School build</p>
          <p className="mt-1 text-xs text-slate-300">
            Supports blind judging, 2-3 judge allocation, public rankings and score publishing control.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full justify-start rounded-xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? 'Signing out...' : 'Logout'}
        </Button>
      </div>
    </aside>
  );
}
