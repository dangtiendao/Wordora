import { z } from 'zod';
import { DeckSchema } from './deck-schema';
import { LearningItemSchema } from './learning-item-schema';
import { AppSettingsSchema } from './settings-schema';

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

export type ExportEnvelope = z.infer<typeof ExportEnvelopeSchema>;
