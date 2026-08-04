'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error internally without exposing raw stack trace on UI
    console.error('Unhandled Route Error:', error.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h2 className="text-xl font-bold text-white">Đã xảy ra sự cố không mong muốn</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Ứng dụng gặp lỗi tạm thời khi tải trang này. Dữ liệu local của bạn trong IndexedDB vẫn hoàn toàn an toàn.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={() => reset()} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại trang
        </Button>
        <Link href="/">
          <Button variant="primary" size="sm" className="gap-1.5">
            <Home className="w-3.5 h-3.5" /> Về Trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
