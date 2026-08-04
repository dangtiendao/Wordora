'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

interface PwaUpdateToastProps {
  registration: ServiceWorkerRegistration | null;
}

export const PwaUpdateToast: React.FC<PwaUpdateToastProps> = ({ registration }) => {
  const [showUpdateToast, setShowUpdateToast] = React.useState(false);

  React.useEffect(() => {
    if (!registration) return;

    const handleUpdateFound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setShowUpdateToast(true);
        }
      };
    };

    registration.addEventListener('updatefound', handleUpdateFound);
    if (registration.waiting) {
      Promise.resolve().then(() => {
        setShowUpdateToast(true);
      });
    }

    return () => {
      registration.removeEventListener('updatefound', handleUpdateFound);
    };
  }, [registration]);

  const handleApplyUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateToast(false);
    window.location.reload();
  };

  if (!showUpdateToast) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white">Có bản cập nhật Wordora mới</h4>
            <p className="text-[11px] text-slate-400">Phiên bản mới đã sẵn sàng cho thiết bị của bạn.</p>
          </div>
        </div>
        <button
          onClick={() => setShowUpdateToast(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
          title="Bỏ qua"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={() => setShowUpdateToast(false)} className="text-xs h-8">
          Để sau
        </Button>
        <Button variant="primary" size="sm" onClick={handleApplyUpdate} className="text-xs h-8 gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Cập nhật ngay
        </Button>
      </div>
    </div>
  );
};
