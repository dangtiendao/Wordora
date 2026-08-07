import { z } from 'zod';

/**
 * Zod Schema xác thực dữ liệu Bộ học (Deck) ở ranh giới hệ thống (API, Form, Import).
 *
 * @remarks
 * - **BUSINESS RULE & BOUNDARY**:
 *   - `id`: Chuỗi định dạng chuẩn UUID v4.
 *   - `name`: Bắt buộc từ 1 đến 100 ký tự.
 *   - `description`: Tối đa 500 ký tự, tự động gán chuỗi rỗng `''` nếu bỏ trống.
 *   - `sourceLanguage`, `targetLanguage`: Mã ngôn ngữ tối thiểu 2 ký tự (ví dụ: 'en', 'vi').
 *   - `color`: Mặc định `#10b981`. `icon`: Mặc định `'book'`.
 *   - `createdAt`, `updatedAt`, `archivedAt`: Chuỗi thời gian chuẩn ISO 8601 datetime UTC.
 */
export const DeckSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Tên bộ học không được để trống').max(100, 'Tên bộ học tối đa 100 ký tự'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').default(''),
  sourceLanguage: z.string().min(2, 'Mã ngôn ngữ nguồn không hợp lệ'),
  targetLanguage: z.string().min(2, 'Mã ngôn ngữ đích không hợp lệ'),
  color: z.string().default('#10b981'),
  icon: z.string().default('book'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().datetime().nullable().optional(),
});

/**
 * Schema xác thực dữ liệu đầu vào khi người dùng hoặc hệ thống tạo mới một Deck.
 */
export const CreateDeckSchema = DeckSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
}).extend({
  id: z.string().uuid().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});

/**
 * Schema xác thực dữ liệu đầu vào khi cập nhật thông tin Deck.
 */
export const UpdateDeckSchema = CreateDeckSchema.partial().extend({
  id: z.string().uuid(),
});

