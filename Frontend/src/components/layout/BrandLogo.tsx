'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const logoSrc = '/Logo%20design%20for%20Digi%20System.png';

export function BrandLogo({
  size = 'md',
  className,
  imageClassName,
  showWordmark = true,
  subtitle,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  imageClassName?: string;
  showWordmark?: boolean;
  subtitle?: string;
}) {
  const containerSpacing =
    size === 'xs' ? 'gap-2' : size === 'sm' ? 'gap-2.5' : 'gap-3';

  const frameSize =
    size === 'xs'
      ? 'h-8 w-8'
      : size === 'sm'
        ? 'h-10 w-10'
        : size === 'lg'
          ? 'h-16 w-16'
          : 'h-12 w-12';

  const wordmarkClass =
    size === 'xs'
      ? 'text-sm'
      : size === 'sm'
        ? 'text-sm'
        : size === 'lg'
          ? 'text-base'
          : 'text-sm';

  return (
    <div className={cn('flex items-center', containerSpacing, className)}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/90 shadow-lg shadow-slate-950/15',
          frameSize
        )}
      >
        <Image
          src={logoSrc}
          alt="KSEF Digi System logo"
          fill
          sizes={
            size === 'xs'
              ? '32px'
              : size === 'sm'
                ? '40px'
                : size === 'lg'
                  ? '64px'
                  : '48px'
          }
          className={cn('object-contain p-1', imageClassName)}
          priority={size !== 'sm'}
        />
      </div>

      {showWordmark ? (
        <div className="min-w-0">
          <p className={cn('truncate font-semibold text-white', wordmarkClass)}>
            KSEF Digi System
          </p>
          <p className="truncate text-xs text-slate-400">
            {subtitle || 'Kenya Science & Engineering Fair'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
