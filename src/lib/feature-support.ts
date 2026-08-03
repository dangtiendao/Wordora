/**
 * Helper to check browser features safely without triggering errors during SSR/Server Components.
 */

export function isIndexedDBSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return 'speechSynthesis' in window && typeof window.speechSynthesis !== 'undefined';
  } catch {
    return false;
  }
}

export function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return 'MediaRecorder' in window && typeof window.MediaRecorder !== 'undefined';
  } catch {
    return false;
  }
}
