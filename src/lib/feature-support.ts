/**
 * Tiện ích kiểm tra các tính năng của trình duyệt an toàn (Browser Feature Detection Helpers).
 *
 * @remarks
 * - **SSR SAFETY & CLIENT BOUNDARY**:
 *   - Kiểm tra `typeof window === 'undefined'` trước khi truy cập các đối tượng toàn cục `indexedDB`, `speechSynthesis`, `MediaRecorder`.
 *   - Đảm bảo các Server Components của Next.js không bị crash khi được render ở môi trường Node.js trên máy chủ.
 */

/**
 * Kiểm tra xem môi trường hiện tại có hỗ trợ IndexedDB hay không.
 */
export function isIndexedDBSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Kiểm tra xem trình duyệt có hỗ trợ Web SpeechSynthesis API (TTS) hay không.
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return 'speechSynthesis' in window && typeof window.speechSynthesis !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Kiểm tra xem trình duyệt có hỗ trợ Web MediaRecorder API (Ghi âm) hay không.
 */
export function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return 'MediaRecorder' in window && typeof window.MediaRecorder !== 'undefined';
  } catch {
    return false;
  }
}

