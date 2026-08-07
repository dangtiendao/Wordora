import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

/**
 * Component hiển thị trạng thái chờ đang tải dữ liệu (`LoadingState`).
 *
 * @remarks
 * - **LOADING STATE CONTRACT**:
 *   - Được hiển thị trong giai đoạn khởi tạo cơ sở dữ liệu IndexedDB hoặc khi đang chạy async fetch dữ liệu.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Đang tải dữ liệu...',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center space-y-3 min-h-[160px]',
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
      {label && <p className="text-xs text-slate-400 font-medium">{label}</p>}
    </div>
  );
};
