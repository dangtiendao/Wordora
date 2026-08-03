import { describe, it, expect } from 'vitest';
import { DeckSchema, CreateDeckSchema } from './deck-schema';
import { LearningItemSchema, CreateLearningItemSchema } from './learning-item-schema';
import { AppSettingsSchema } from './settings-schema';
import { ExportEnvelopeSchema } from './export-schema';
import { generateUUID } from '@/lib/uuid';

describe('Domain Zod Schemas Validation', () => {
  it('validates Deck input correctly', () => {
    const validDeck = {
      id: generateUUID(),
      name: 'Tiếng Anh Giao Tiếp',
      description: 'Bộ học giao tiếp',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      color: '#10b981',
      icon: 'book',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(DeckSchema.safeParse(validDeck).success).toBe(true);

    const invalidDeck = { ...validDeck, name: '' };
    expect(DeckSchema.safeParse(invalidDeck).success).toBe(false);
  });

  it('validates CreateDeckSchema with optional id', () => {
    const input = {
      name: 'Tiếng Nhật N5',
      sourceLanguage: 'ja',
      targetLanguage: 'vi',
    };

    expect(CreateDeckSchema.safeParse(input).success).toBe(true);
  });

  it('validates LearningItem input correctly', () => {
    const validItem = {
      id: generateUUID(),
      deckId: generateUUID(),
      type: 'vocabulary',
      prompt: 'apple',
      answer: 'quả táo',
      tags: ['fruit'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(LearningItemSchema.safeParse(validItem).success).toBe(true);

    const createInput = {
      deckId: generateUUID(),
      type: 'vocabulary' as const,
      prompt: 'orange',
      answer: 'quả cam',
    };
    expect(CreateLearningItemSchema.safeParse(createInput).success).toBe(true);

    const invalidItem = { ...validItem, type: 'unknown_type' };
    expect(LearningItemSchema.safeParse(invalidItem).success).toBe(false);
  });

  it('validates AppSettings schema', () => {
    const defaultSettings = {
      id: 'default',
      speechLanguage: 'en-US',
      speechRate: 1.0,
      speechPitch: 1.0,
      dailyNewItemLimit: 10,
      sessionSize: 20,
      autoPlaySpeech: false,
      answerComparisonOptions: {
        ignoreCase: true,
        ignorePunctuation: true,
        ignoreWhitespace: true,
      },
      reviewOptions: {
        enableTTS: true,
        enableRecording: true,
        showPhonetic: true,
        showExample: true,
      },
      updatedAt: new Date().toISOString(),
    };
    expect(AppSettingsSchema.safeParse(defaultSettings).success).toBe(true);
  });

  it('validates ExportEnvelope schema', () => {
    const validExport = {
      app: 'wordora',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        decks: [
          {
            id: generateUUID(),
            name: 'Sample Deck',
            description: '',
            sourceLanguage: 'en',
            targetLanguage: 'vi',
            color: '#10b981',
            icon: 'book',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        learningItems: [],
      },
    };

    expect(ExportEnvelopeSchema.safeParse(validExport).success).toBe(true);
  });
});
