'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers, GraduationCap, RefreshCw, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export const navItems = [
  { label: 'Tổng quan', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Bộ học', href: '/decks', icon: Layers },
  { label: 'Học tập', href: '/study', icon: GraduationCap },
  { label: 'Ôn tập', href: '/review', icon: RefreshCw },
  { label: 'Thống kê', href: '/statistics', icon: BarChart2 },
  { label: 'Cài đặt', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-950/60 min-h-[calc(100vh-4rem)] p-4 space-y-1 shrink-0">
      <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
        Điều hướng
      </div>
      <nav className="space-y-1">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-emerald-400' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
