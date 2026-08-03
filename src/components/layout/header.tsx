'use client';

import * as React from 'react';
import Link from 'next/link';
import { BookOpen, Wifi } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform">
          <BookOpen className="w-5 h-5 font-bold" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            Wordora
          </span>
          <span className="text-[10px] text-slate-400 -mt-1 hidden sm:inline">Học ngoại ngữ local-first</span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local-First</span>
        </div>
      </div>
    </header>
  );
};
