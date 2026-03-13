import Link from 'next/link';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  return (
    <footer className="theme-public-header border-t border-white/10 bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <BrandLogo size="xs" showWordmark={false} className="shrink-0" />
          <div>
            <p className="font-medium text-white">KSEF Digi System</p>
            <p>Powered by Ngao Girls High School. (c) 2026 All rights reserved.</p>
          </div>
        </div>
        <div className="flex gap-5">
          <Link href="#" className="transition hover:text-white">
            Privacy Policy
          </Link>
          <Link href="#" className="transition hover:text-white">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
