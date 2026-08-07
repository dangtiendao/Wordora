'use client';

import * as React from 'react';
import { Button } from './button';

/** Props giao diện cho Dialog modal (`DialogProps`). */
export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

/**
 * Component Hộp thoại Modal dùng chung cho toàn ứng dụng (`Dialog`).
 *
 * @remarks
 * - **ACCESSIBILITY CONTRACT (WAI-ARIA MODAL PATTERN)**:
 *   - Sử dụng `role="dialog"`, `aria-modal="true"`, `aria-labelledby="dialog-title"`, `aria-describedby="dialog-description"`.
 * - **KEYBOARD & SCROLL BEHAVIOR**:
 *   - Lắng nghe phím `Escape` để gọi callback `onClose()`.
 *   - Tự động khóa cuộn trang nền (`document.body.style.overflow = 'hidden'`) khi hộp thoại đang mở và khôi phục khi đóng.
 * - **DESTRUCTIVE ACTION SUPPORT**:
 *   - Hỗ trợ `variant="danger"` hiển thị nút xác nhận màu đỏ cảnh báo thao tác nguy hiểm (xóa bộ học, hủy phiên học).
 */
export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  variant = 'default',
  isLoading = false,
}) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <div className="space-y-1.5">
          <h2 id="dialog-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          {description && (
            <p id="dialog-description" className="text-sm text-slate-400">
              {description}
            </p>
          )}
        </div>

        {children && <div className="py-2">{children}</div>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

