import { z } from 'zod';

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

export const CreateDeckSchema = DeckSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
}).extend({
  id: z.string().uuid().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});

export const UpdateDeckSchema = CreateDeckSchema.partial().extend({
  id: z.string().uuid(),
});
