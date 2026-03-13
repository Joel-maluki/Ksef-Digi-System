'use client';

import { useEffect } from 'react';
import { Footer } from '@/components/layout/Footer';
import { applyTheme, getPreferredTheme } from '@/lib/theme';

export default function ClientBody({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getPreferredTheme());
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
