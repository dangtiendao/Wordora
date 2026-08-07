/**
 * Trạng thái hoạt động của dịch vụ thu âm.
 */
export type RecordingState = 'idle' | 'recording' | 'paused' | 'error';

/**
 * Kết quả dữ liệu thu âm trả về khi kết thúc quá trình ghi âm.
 *
 * @remarks
 * - `blob`: Dữ liệu nhị phân (Binary Large Object) chứa âm thanh đã thu.
 * - `mimeType`: Kiểu định dạng âm thanh thực tế (ví dụ: 'audio/webm', 'audio/ogg', hoặc 'audio/mp4').
 * - `durationSeconds`: Thời lượng ghi âm thực tế tính theo giây.
 */
export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
}

/**
 * Service hợp đồng trừu tượng quản lý tính năng Ghi âm (MediaRecorder Web API Adapter Interface).
 *
 * @remarks
 * - **CONTRACT & LIFECYCLE BOUNDARY**:
 *   - Cách ly triệt để domain với MediaRecorder Web API.
 *   - `requestPermission()`: Xin cấp quyền truy cập micro từ trình duyệt.
 *   - `start(maxDurationSeconds?)`: Kích hoạt ghi âm.
 *   - `stop()`: Dừng ghi âm và trả về `RecordingResult` đóng gói trong Blob nhị phân.
 *   - `onStateChange()`: Đăng ký lắng nghe thay đổi trạng thái và trả về hàm hủy đăng ký (cleanup/unsubscribe function).
 */
export interface RecordingService {
  isSupported(): boolean;
  requestPermission(): Promise<boolean>;
  start(maxDurationSeconds?: number): Promise<void>;
  stop(): Promise<RecordingResult>;
  cancel(): void;
  getState(): RecordingState;
  onStateChange(callback: (state: RecordingState) => void): () => void;
}


