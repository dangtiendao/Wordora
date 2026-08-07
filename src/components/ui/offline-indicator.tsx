'use client';

import * as React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff } from 'lucide-react';

/**
 * Component hiển thị thông báo trạng thái ngoại tuyến khi người dùng mất mạng (`OfflineIndicator`).
 *
 * @remarks
 * - **ACCESSIBILITY & NON-BLOCKING UI**:
 *   - Sử dụng `role="status"` và `aria-live="polite"` để thông báo thân thiện với trình đọc màn hình.
 *   - Hiển thị thông điệp khẳng định dữ liệu local vẫn hoàn toàn sẵn sàng cho việc học và quản lý từ vựng offline.
 */
export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/90 border border-amber-800 text-amber-300 text-xs shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Ngoại tuyến - Dữ liệu local vẫn sẵn sàng</span>
    </div>
  );
};

