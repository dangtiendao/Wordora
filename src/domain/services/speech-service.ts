/**
 * Data Transfer Object thông tin giọng đọc khả thi thu thập từ Web Speech API.
 */
export interface SpeechVoiceDTO {
  uri: string;
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
}

/**
 * Tùy chọn cấu hình tham số phát âm TTS.
 */
export interface SpeechOptions {
  rate?: number; // 0.5 to 2.0 (default 1.0)
  pitch?: number; // 0.5 to 1.5 (default 1.0)
  volume?: number; // 0.0 to 1.0 (default 1.0)
  voiceUri?: string;
  lang?: string;
}

/**
 * Trạng thái hoạt động của dịch vụ chuyển văn bản thành giọng nói (TTS).
 */
export type SpeechState = 'idle' | 'speaking' | 'paused' | 'error';

/**
 * Service hợp đồng trừu tượng điều khiển Tổng hợp giọng nói TTS (SpeechSynthesis Web API Adapter Interface).
 *
 * @remarks
 * - **CONTRACT & LIFECYCLE BOUNDARY**:
 *   - Cách ly triệt để domain với trình duyệt Web SpeechSynthesis API.
 *   - `getVoices()`: Tải danh sách giọng đọc khả thi từ trình duyệt.
 *   - `speak(text, options?)`: Thực hiện phát âm không nghẽn luồng (non-blocking).
 *   - `onStateChange()`: Đăng ký hàm phản hồi khi trạng thái TTS thay đổi, trả về hàm unsubscribe cleanup.
 */
export interface SpeechService {
  isSupported(): boolean;
  getVoices(): Promise<SpeechVoiceDTO[]>;
  speak(text: string, options?: SpeechOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  getState(): SpeechState;
  onStateChange(callback: (state: SpeechState) => void): () => void;
}


