import { z } from 'zod';

export const MAX_IMPORT_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB max limit

/**
 * Strips prototype pollution keys (__proto__, constructor, prototype) recursively.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const cleanObj: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    cleanObj[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
  }

  return cleanObj as T;
}

export const DeckSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
  color: z.string().optional().default('emerald'),
  icon: z.string().optional().default('book'),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LearningItemSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),
  type: z.enum(['vocabulary', 'phrase', 'sentence']),
  prompt: z.string().min(1),
  answer: z.string().min(1),
  phonetic: z.string().optional(),
  example: z.string().optional(),
  exampleTranslation: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.number().min(1).max(5).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ReviewStateSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  status: z.enum(['new', 'learning', 'review', 'mastered']),
  dueAt: z.string(),
  intervalDays: z.number().min(0),
  easeFactor: z.number().min(1.3).max(3.5),
  repetitions: z.number().min(0),
  lapses: z.number().min(0),
  lastRating: z.enum(['again', 'hard', 'good', 'easy']).nullable().optional(),
  lastReviewedAt: z.string().nullable().optional(),
  algorithmVersion: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ReviewLogSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  sessionId: z.string().uuid().nullable().optional(),
  exerciseType: z.enum(['multipleChoice', 'fillInBlank', 'sentenceOrdering']),
  rating: z.enum(['again', 'hard', 'good', 'easy']),
  isCorrect: z.boolean(),
  responseTimeMs: z.number().min(0),
  reviewedAt: z.string(),
  previousIntervalDays: z.number().min(0),
  nextIntervalDays: z.number().min(0),
  algorithmVersion: z.string(),
});

export const StudySessionSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),
  mode: z.enum(['flashcard', 'quiz', 'mixed']),
  totalQuestions: z.number().min(0),
  correctAnswers: z.number().min(0),
  durationSeconds: z.number().min(0),
  startedAt: z.string(),
  completedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SettingsSchema = z.object({
  id: z.string().optional(),
  speechLanguage: z.string().optional(),
  preferredVoiceURI: z.string().nullable().optional(),
  speechRate: z.number().optional(),
  speechPitch: z.number().optional(),
  dailyNewItemLimit: z.number().optional(),
  sessionSize: z.number().optional(),
  updatedAt: z.string().optional(),
});

export const ExportEnvelopeSchema = z.object({
  app: z.literal('wordora'),
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  data: z.object({
    decks: z.array(DeckSchema),
    learningItems: z.array(LearningItemSchema),
    reviewStates: z.array(ReviewStateSchema),
    reviewLogs: z.array(ReviewLogSchema),
    studySessions: z.array(StudySessionSchema),
    settings: SettingsSchema,
  }),
  recordings: z.object({
    included: z.literal(false),
    count: z.number().min(0),
  }),
});
