'use client';

import { useState, useEffect } from 'react';

/**
 * Custom React Hook theo dõi trạng thái kết nối mạng thời gian thực (`useOnlineStatus`).
 *
 * @remarks
 * - **SSR SAFETY & HYDRATION GUARD**:
 *   - Khởi tạo giá trị mặc định `true` khi SSR (`typeof window === 'undefined'`) để tránh xung đột hydration mismatch giữa server rendering và client render.
 *   - Lắng nghe hai sự kiện toàn cục `window.addEventListener('online')` và `window.addEventListener('offline')`.
 * - **OFFLINE CAPABILITY INTEGRATION**:
 *   - Được sử dụng bởi `OfflineIndicator` để hiển thị thông báo trạng thái ngoại tuyến khi bị ngắt kết nối mạng.
 *
 * @returns `true` nếu trình duyệt đang có kết nối mạng, `false` nếu bị mất mạng.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Default true for SSR
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

