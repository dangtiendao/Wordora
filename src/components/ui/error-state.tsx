import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã xảy ra lỗi',
  message,
  onRetry,
  retryLabel = 'Thử lại',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-rose-900/50 bg-rose-950/20 text-slate-200 space-y-3',
        className
      )}
      role="alert"
    >
      <div className="w-10 h-10 rounded-full bg-rose-900/40 text-rose-400 flex items-center justify-center font-bold text-lg">
        !
      </div>
      <h3 className="text-sm font-semibold text-rose-200">{title}</h3>
      <p className="text-xs text-rose-300/80 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1 border-rose-800 hover:bg-rose-900/40">
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
