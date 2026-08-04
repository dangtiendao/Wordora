import { Deck } from '@/domain/entities/deck';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { ReviewLog } from '@/domain/entities/review-log';
import { StudySession } from '@/domain/entities/study-session';
import { AppSettings } from '@/domain/entities/app-settings';

export interface RecordingsMetadata {
  included: false;
  count: number;
}

export interface ExportDataPayload {
  decks: Deck[];
  learningItems: LearningItem[];
  reviewStates: ReviewState[];
  reviewLogs: ReviewLog[];
  studySessions: StudySession[];
  settings: Partial<AppSettings>;
}

export interface ExportEnvelope {
  app: 'wordora';
  schemaVersion: 1;
  exportedAt: string; // ISO 8601 UTC
  data: ExportDataPayload;
  recordings: RecordingsMetadata;
}

export type ConflictStrategy = 'skip' | 'overwrite' | 'duplicate';

export interface ValidationErrorDetail {
  path: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  schemaVersion?: number;
  exportedAt?: string;
  errors: ValidationErrorDetail[];
  envelope?: ExportEnvelope;
}

export interface ImportPreview {
  deckCount: number;
  learningItemCount: number;
  reviewStateCount: number;
  reviewLogCount: number;
  studySessionCount: number;
  hasSettings: boolean;
  schemaVersion: number;
  exportedAt: string;
  recordingsCount: number;
  validationResult: ValidationResult;
}

export interface ImportOptions {
  conflictStrategy?: ConflictStrategy;
  restoreSettings?: boolean;
}
