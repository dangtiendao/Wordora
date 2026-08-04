'use client';

import * as React from 'react';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { PwaInstallPrompt } from '@/components/ui/pwa-install-prompt';
import { PwaUpdateToast } from '@/components/ui/pwa-update-toast';

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [swRegistration, setSwRegistration] = React.useState<ServiceWorkerRegistration | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker in production or client environment
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setSwRegistration(reg);
      })
      .catch(() => {
        // Silent catch for SW registration
      });
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator />
      <PwaInstallPrompt />
      <PwaUpdateToast registration={swRegistration} />
    </>
  );
};
