import * as React from 'react';
import { cn } from '@/lib/utils';

export interface UnsupportedFeatureProps {
  featureName: string;
  description?: string;
  className?: string;
}

/**
 * Component hiển thị thông báo tính năng không được trình duyệt hiện tại hỗ trợ (`UnsupportedFeature`).
 *
 * @remarks
 * - **UNSUPPORTED FEATURE CONTRACT**:
 *   - Được hiển thị khi kiểm tra `isIndexedDBSupported()`, `isSpeechSynthesisSupported()`, hoặc `isMediaRecorderSupported()` trả về `false`.
 *   - Gợi ý người dùng nâng cấp hoặc đổi sang trình duyệt hiện đại hơn (Chrome, Firefox, Safari, Edge).
 */
export const UnsupportedFeature: React.FC<UnsupportedFeatureProps> = ({
  featureName,
  description,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-amber-800/40 bg-amber-950/20 text-slate-200 space-y-2',
        className
      )}
    >
      <div className="w-9 h-9 rounded-full bg-amber-900/40 text-amber-400 flex items-center justify-center font-bold text-base">
        ⚠️
      </div>
      <h4 className="text-sm font-medium text-amber-200">
        Tính năng {featureName} không được trình duyệt hỗ trợ
      </h4>
      {description && <p className="text-xs text-amber-300/80 max-w-sm">{description}</p>}
    </div>
  );
};

