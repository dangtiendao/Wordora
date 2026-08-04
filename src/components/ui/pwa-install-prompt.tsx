'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isIosSafari, setIsIosSafari] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isStandalone = 'standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone;

    if (isIos && isSafari && !isStandalone) {
      Promise.resolve().then(() => {
        setIsIosSafari(true);
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isDismissed) return null;

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Cài đặt ứng dụng Wordora</h4>
              <p className="text-[11px] text-slate-400">Học từ vựng nhanh hơn từ màn hình chính</p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            title="Bỏ qua"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={() => setIsDismissed(true)} className="text-xs h-8">
            Để sau
          </Button>
          <Button variant="primary" size="sm" onClick={handleInstallClick} className="text-xs h-8 gap-1.5">
            <Download className="w-3.5 h-3.5" /> Cài đặt ngay
          </Button>
        </div>
      </div>
    );
  }

  if (isIosSafari) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md space-y-2 text-xs text-slate-300 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-center justify-between">
          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
            <Share className="w-4 h-4" /> Cài đặt Wordora trên iOS
          </span>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Nhấn vào nút <strong className="text-white">Chia sẻ (<Share className="w-3 h-3 inline" />)</strong> trên trình duyệt Safari, sau đó chọn <strong className="text-white">&ldquo;Thêm vào Màn hình chính&rdquo;</strong> để trải nghiệm mượt mà hơn.
        </p>
      </div>
    );
  }

  return null;
};
