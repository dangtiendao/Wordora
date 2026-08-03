import { z } from 'zod';
import { LearningItemTypeSchema } from '@/domain/schemas/learning-item-schema';
import { normalizeTags } from '@/features/learning-items/application/learning-item-use-cases';

export const LearningItemImportDTOSchema = z.object({
  id: z.string().uuid().optional(),
  type: LearningItemTypeSchema.default('vocabulary'),
  prompt: z.string().min(1, 'Nội dung cần học không được để trống'),
  answer: z.string().min(1, 'Đáp án không được để trống'),
  phonetic: z.string().optional().default(''),
  example: z.string().optional().default(''),
  exampleTranslation: z.string().optional().default(''),
  note: z.string().optional().default(''),
  partOfSpeech: z.string().optional().default(''),
  difficulty: z.coerce.number().int().min(1).max(5).optional().default(3),
  tags: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => normalizeTags(val))
    .default([]),
});

export type LearningItemImportDTO = z.infer<typeof LearningItemImportDTOSchema>;
