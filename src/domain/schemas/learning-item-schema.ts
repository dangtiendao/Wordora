import { z } from 'zod';

export const LearningItemTypeSchema = z.enum(['vocabulary', 'phrase', 'sentence']);

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

export const CreateLearningItemSchema = LearningItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().uuid().optional(),
});

export const UpdateLearningItemSchema = CreateLearningItemSchema.partial().extend({
  id: z.string().uuid(),
});
