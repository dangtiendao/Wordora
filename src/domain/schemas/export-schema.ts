import { z } from 'zod';
import { DeckSchema } from './deck-schema';
import { LearningItemSchema } from './learning-item-schema';
import { AppSettingsSchema } from './settings-schema';

/**
 * Zod Schema cho bao bọc sao lưu/xuất-nhập dữ liệu (Export/Import Data Envelope).
 *
 * @remarks
 * - **CONTRACT & EXTENSION POINT**:
 *   - `app`: Bắt buộc là chuỗi literal `'wordora'` để phân biệt tệp tin xuất từ Wordora với các ứng dụng khác.
 *   - `schemaVersion`: Số nguyên dương đánh dấu phiên bản cấu trúc file JSON backup (dùng cho migration/backward compatibility khi mở rộng tính năng hoặc đồng bộ backend).
 *   - `exportedAt`: Mốc thời gian ISO 8601 datetime UTC lúc thực hiện export.
 *   - `data`: Chứa danh sách bộ học `decks`, danh sách thẻ học `learningItems` và cài đặt `settings` (tùy chọn).
 */
export const ExportEnvelopeSchema = z.object({
  app: z.literal('wordora'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string().datetime(),
  data: z.object({
    decks: z.array(DeckSchema),
    learningItems: z.array(LearningItemSchema),
    settings: AppSettingsSchema.optional(),
  }),
});

/**
 * Type hợp đồng dữ liệu Xuất/Nhập (Export/Import DTO) suy luận từ ExportEnvelopeSchema.
 */
export type ExportEnvelope = z.infer<typeof ExportEnvelopeSchema>;

