'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function BackButton({
  fallbackHref = '/',
  className,
  label = 'Back',
}: {
  fallbackHref?: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    if (pathname !== fallbackHref) {
      router.push(fallbackHref);
      return;
    }

    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleBack}
      className={cn(
        'theme-back-button rounded-xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white',
        className
      )}
      aria-label={label}
      title={label}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
