import { z } from 'zod';

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

export const UpdateAppSettingsSchema = AppSettingsSchema.partial().omit({ id: true });
