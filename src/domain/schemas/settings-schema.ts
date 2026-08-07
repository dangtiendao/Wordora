import { z } from 'zod';

/**
 * Zod Schema xác thực dữ liệu Cấu hình ứng dụng Singleton (AppSettings).
 *
 * @remarks
 * - **BUSINESS RULE & BOUNDARY**:
 *   - `speechLanguage`: Mã ngôn ngữ TTS tối thiểu 2 ký tự (VD: 'en-US').
 *   - `speechRate`: Trong khoảng `[0.5, 2.0]`.
 *   - `speechPitch`: Trong khoảng `[0.5, 1.5]`.
 *   - `dailyNewItemLimit`: Số mục học mới nguyên từ `1` đến `200`.
 *   - `sessionSize`: Quy mô câu hỏi trong một phiên học nguyên từ `5` đến `100`.
 *   - `updatedAt`: Chuỗi ISO 8601 datetime UTC.
 */
export const AppSettingsSchema = z.object({
  id: z.string(),
  speechLanguage: z.string().min(2),
  preferredVoiceURI: z.string().nullable().optional(),
  speechRate: z.number().min(0.5).max(2.0),
  speechPitch: z.number().min(0.5).max(1.5),
  dailyNewItemLimit: z.number().int().min(1).max(200),
  sessionSize: z.number().int().min(5).max(100),
  autoPlaySpeech: z.boolean(),
  answerComparisonOptions: z.object({
    ignoreCase: z.boolean(),
    ignorePunctuation: z.boolean(),
    ignoreWhitespace: z.boolean(),
  }),
  reviewOptions: z.object({
    enableTTS: z.boolean(),
    enableRecording: z.boolean(),
    showPhonetic: z.boolean(),
    showExample: z.boolean(),
  }),
  updatedAt: z.string().datetime(),
});

/**
 * Schema xác thực dữ liệu cập nhật một phần cấu hình ứng dụng.
 */
export const UpdateAppSettingsSchema = AppSettingsSchema.partial().omit({ id: true });

