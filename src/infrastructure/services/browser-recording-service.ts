import {
  RecordingService,
  RecordingState,
  RecordingResult,
} from '@/domain/services/recording-service';

/**
 * Lớp triển khai dịch vụ Ghi âm giọng nói sử dụng Web MediaRecorder API của trình duyệt.
 *
 * @remarks
 * - **USER GESTURE & PERMISSION LIFECYCLE**:
 *   - Yêu cầu cấp quyền `navigator.mediaDevices.getUserMedia({ audio: true })` chỉ phát sinh sau thao tác người dùng.
 *   - Trong `requestPermission()`, các stream tracks được dừng ngay lập tức (`track.stop()`) để tắt ngay đèn báo hiệu micro trên phần cứng.
 * - **MIME TYPE SELECTION & FALLBACK**:
 *   - Kiểm tra định dạng hỗ trợ bằng `MediaRecorder.isTypeSupported(type)` theo thứ tự ưu tiên 5 cấp:
 *     1. `'audio/webm;codecs=opus'` (Chrome/Firefox/Edge)
 *     2. `'audio/webm'`
 *     3. `'audio/ogg;codecs=opus'`
 *     4. `'audio/mp4'` (Safari iOS / macOS)
 *     5. `'audio/aac'`
 * - **MEDIASTREAMTRACK & RESOURCE CLEANUP**:
 *   - `cleanupStreamTracks()` gọi `track.stop()` trên toàn bộ micro tracks khi `stop()`, `cancel()` hoặc gặp lỗi, phòng tránh rò rỉ kết nối phần cứng micro.
 * - **AUTO-STOP & TIMER CLEANUP**:
 *   - Tự động dừng thu âm sau thời gian tối đa `maxDurationSeconds` (mặc định 30s).
 *   - Xóa timer `clearAutoStopTimer()` ngay khi thu âm kết thúc hoặc bị hủy.
 * - **LOCAL PRIVACY**:
 *   - Dữ liệu thu âm thu thập dạng `Blob` nhị phân và lưu trữ trực tiếp trên IndexedDB địa phương, tuyệt đối không gửi lên máy chủ từ xa.
 */
export class BrowserRecordingService implements RecordingService {
  private state: RecordingState = 'idle';
  private listeners: Set<(state: RecordingState) => void> = new Set();
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private maxDurationTimer: NodeJS.Timeout | null = null;
  private selectedMimeType: string = '';

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  getState(): RecordingState {
    return this.state;
  }

  private setState(newState: RecordingState): void {
    this.state = newState;
    this.listeners.forEach((cb) => cb(newState));
  }

  onStateChange(callback: (state: RecordingState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop requested stream tracks after testing permission
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  private selectMimeType(): string {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return '';
    }

    const preferredTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
    ];

    for (const type of preferredTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }

  private cleanupStreamTracks(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Silent catch
        }
      });
      this.mediaStream = null;
    }
  }

  private clearAutoStopTimer(): void {
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
  }

  async start(maxDurationSeconds = 30): Promise<void> {
    if (!this.isSupported()) {
      this.setState('error');
      throw new Error('Trình duyệt không hỗ trợ ghi âm Web MediaRecorder API.');
    }

    if (this.state === 'recording') {
      return;
    }

    this.cleanupStreamTracks();
    this.audioChunks = [];
    this.clearAutoStopTimer();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.selectedMimeType = this.selectMimeType();

      const options = this.selectedMimeType ? { mimeType: this.selectedMimeType } : undefined;
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = () => {
        this.setState('error');
        this.cleanupStreamTracks();
        this.clearAutoStopTimer();
      };

      this.mediaRecorder.start();
      this.startTime = Date.now();
      this.setState('recording');

      // Set auto-stop timer (default 30 seconds)
      this.maxDurationTimer = setTimeout(() => {
        if (this.state === 'recording') {
          this.stop().catch(() => {});
        }
      }, maxDurationSeconds * 1000);
    } catch (err: unknown) {
      this.setState('error');
      this.cleanupStreamTracks();
      throw err;
    }
  }

  async stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      this.clearAutoStopTimer();

      if (!this.mediaRecorder || this.state !== 'recording') {
        this.cleanupStreamTracks();
        this.setState('idle');
        return reject(new Error('Chưa bắt đầu ghi âm hoặc ghi âm đã dừng.'));
      }

      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - this.startTime) / 1000)
      );

      this.mediaRecorder.onstop = () => {
        const mimeType = this.selectedMimeType || this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });

        this.cleanupStreamTracks();
        this.setState('idle');

        if (blob.size === 0) {
          return reject(new Error('Bản ghi âm không có dữ liệu âm thanh (0 bytes).'));
        }

        resolve({
          blob,
          mimeType,
          durationSeconds,
        });
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        this.cleanupStreamTracks();
        this.setState('error');
        reject(err);
      }
    });
  }

  cancel(): void {
    this.clearAutoStopTimer();
    if (this.mediaRecorder && this.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Silent catch
      }
    }
    this.audioChunks = [];
    this.cleanupStreamTracks();
    this.setState('idle');
  }
}

