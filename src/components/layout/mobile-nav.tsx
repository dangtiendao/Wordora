'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from './sidebar';
import { cn } from '@/lib/utils';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-full h-full min-h-[48px] text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:text-emerald-400',
              isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            )}
            aria-label={item.label}
          >
            <Icon className={cn('w-5 h-5', isActive ? 'text-emerald-400 scale-110' : 'text-slate-400')} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
