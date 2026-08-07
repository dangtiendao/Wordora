/**
 * Cấu hình so sánh đáp án chuỗi nhập vào từ người dùng với đáp án chuẩn.
 *
 * @remarks
 * - **BUSINESS RULE**:
 *   - `ignoreCase`: Bỏ qua phân biệt chữ hoa / chữ thường.
 *   - `ignorePunctuation`: Bỏ qua dấu câu (ví dụ: dấu chấm, phẩy, hỏi chấm).
 *   - `ignoreWhitespace`: Bỏ qua khoảng trắng thừa ở đầu/cuối chuỗi và chuẩn hóa khoảng trắng đệm.
 */
export interface AnswerComparisonOptions {
  ignoreCase: boolean;
  ignorePunctuation: boolean;
  ignoreWhitespace: boolean;
}

/**
 * Tùy chọn hiển thị và tính năng trong các phiên ôn tập/học thẻ.
 *
 * @remarks
 * - **BUSINESS RULE**: Bật/tắt phát âm tự động TTS, tính năng thu âm voice, hiển thị ký âm phonetic và câu ví dụ minh họa.
 */
export interface ReviewOptions {
  enableTTS: boolean;
  enableRecording: boolean;
  showPhonetic: boolean;
  showExample: boolean;
}

/**
 * Cấu hình ứng dụng dạng Singleton (AppSettings).
 *
 * @remarks
 * - **SINGLETON PATTERN & INVARIANT**:
 *   - `id` luôn luôn nhận giá trị cố định `'default'`. Chỉ tồn tại duy nhất 1 bản ghi cấu hình trong ứng dụng.
 *   - `speechRate`: Tốc độ phát âm TTS, giới hạn trong khoảng `[0.5, 2.0]`.
 *   - `speechPitch: Cao độ phát âm TTS, giới hạn trong khoảng `[0.5, 1.5]`.
 *   - `dailyNewItemLimit`: Giới hạn số mục học mới mỗi ngày (từ 1 đến 200).
 *   - `sessionSize`: Số lượng câu hỏi/mục học trong một phiên học (từ 5 đến 100).
 *   - `updatedAt`: Dấu mốc thời gian ISO 8601 UTC cập nhật gần nhất.
 */
export interface AppSettings {
  id: string; // Singleton setting ID, e.g., 'default'
  speechLanguage: string;
  preferredVoiceURI?: string | null;
  speechRate: number; // 0.5 to 2.0
  speechPitch: number; // 0.5 to 1.5
  dailyNewItemLimit: number;
  sessionSize: number;
  autoPlaySpeech: boolean;
  answerComparisonOptions: AnswerComparisonOptions;
  reviewOptions: ReviewOptions;
  updatedAt: string; // ISO 8601 UTC
}

/**
 * Cấu hình mặc định ban đầu khi ứng dụng khởi chạy lần đầu tiên hoặc khi khôi phục cài đặt gốc.
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'default',
  speechLanguage: 'en-US',
  preferredVoiceURI: null,
  speechRate: 1.0,
  speechPitch: 1.0,
  dailyNewItemLimit: 10,
  sessionSize: 20,
  autoPlaySpeech: false,
  answerComparisonOptions: {
    ignoreCase: true,
    ignorePunctuation: true,
    ignoreWhitespace: true,
  },
  reviewOptions: {
    enableTTS: true,
    enableRecording: true,
    showPhonetic: true,
    showExample: true,
  },
  updatedAt: new Date(0).toISOString(),
};

/**
 * Payload dữ liệu đầu vào khi cập nhật cấu hình ứng dụng.
 *
 * @remarks
 * - **CONTRACT**: Không cho phép thay đổi `id` (luôn giữ giá trị `'default'`).
 */
export type UpdateAppSettingsInput = Partial<Omit<AppSettings, 'id'>>;

