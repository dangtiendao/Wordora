import { z } from 'zod';

/**
 * Zod validator cho kiểu phân loại mục học (`vocabulary`, `phrase`, `sentence`).
 */
export const LearningItemTypeSchema = z.enum(['vocabulary', 'phrase', 'sentence']);

/**
 * Zod Schema xác thực dữ liệu Thẻ / Mục học (LearningItem).
 *
 * @remarks
 * - **BUSINESS RULE & BOUNDARY**:
 *   - `id`, `deckId`: Bắt buộc là định dạng chuẩn chuỗi UUID v4.
 *   - `prompt`: Văn bản từ vựng / câu hỏi không được để trống (tối thiểu 1 ký tự).
 *   - `answer`: Nghĩa / đáp án không được để trống (tối thiểu 1 ký tự).
 *   - `difficulty`: Nếu có phải là số nguyên trong khoảng `[1, 5]`.
 *   - `tags`: Mặc định là mảng rỗng `[]` nếu không cung cấp.
 *   - `createdAt`, `updatedAt`: Đảm bảo tuân thủ ISO 8601 datetime UTC.
 */
export const LearningItemSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),
  type: LearningItemTypeSchema,
  prompt: z.string().min(1, 'Nội dung câu hỏi/từ vựng không được để trống'),
  answer: z.string().min(1, 'Đáp án/nghĩa không được để trống'),
  phonetic: z.string().optional(),
  example: z.string().optional(),
  exampleTranslation: z.string().optional(),
  note: z.string().optional(),
  partOfSpeech: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Schema xác thực dữ liệu khi tạo mới một Mục học (LearningItem).
 */
export const CreateLearningItemSchema = LearningItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().uuid().optional(),
});

/**
 * Schema xác thực dữ liệu khi cập nhật thông tin Mục học (LearningItem).
 */
export const UpdateLearningItemSchema = CreateLearningItemSchema.partial().extend({
  id: z.string().uuid(),
});

