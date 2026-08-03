import Dexie, { type Table } from 'dexie';
import { Deck } from '@/domain/entities/deck';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { ReviewLog } from '@/domain/entities/review-log';
import { StudySession } from '@/domain/entities/study-session';
import { Recording } from '@/domain/entities/recording';
import { AppSettings } from '@/domain/entities/app-settings';

export interface AppMetadata {
  key: string;
  value: string | number | boolean | object;
}

export class WordoraDatabase extends Dexie {
  decks!: Table<Deck, string>;
  learningItems!: Table<LearningItem, string>;
  reviewStates!: Table<ReviewState, string>;
  reviewLogs!: Table<ReviewLog, string>;
  studySessions!: Table<StudySession, string>;
  recordings!: Table<Recording, string>;
  settings!: Table<AppSettings, string>;
  appMetadata!: Table<AppMetadata, string>;

  constructor(databaseName = 'wordora_db') {
    super(databaseName);

    // Schema Version 1
    // Primary keys use string UUIDs (never auto-increment) to support seamless bulk import/export.
    this.version(1).stores({
      decks: 'id, name, sourceLanguage, targetLanguage, createdAt, updatedAt, archivedAt',
      learningItems: 'id, deckId, type, createdAt, updatedAt',
      reviewStates: 'id, itemId, status, dueAt, createdAt, updatedAt',
      reviewLogs: 'id, itemId, sessionId, reviewedAt',
      studySessions: 'id, deckId, mode, startedAt, completedAt, createdAt',
      recordings: 'id, itemId, createdAt',
      settings: 'id, updatedAt',
      appMetadata: 'key',
    });
  }
}

// Global lazy singleton for Client usage
let dbInstance: WordoraDatabase | null = null;

export function getWordoraDatabase(databaseName?: string): WordoraDatabase {
  if (typeof window === 'undefined') {
    throw new Error('Attempted to initialize IndexedDB on Server Component / SSR environment.');
  }

  if (!dbInstance || (databaseName && dbInstance.name !== databaseName)) {
    dbInstance = new WordoraDatabase(databaseName);
  }
  return dbInstance;
}

export function resetDatabaseInstance(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
