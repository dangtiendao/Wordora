import { SessionMode } from '../value-objects/types';

export interface StudySession {
  id: string;
  deckId: string;
  mode: SessionMode;
  startedAt: string; // ISO 8601 UTC
  completedAt?: string | null; // ISO 8601 UTC if completed
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}

export type CreateStudySessionInput = Omit<StudySession, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type UpdateStudySessionInput = Partial<Omit<StudySession, 'id' | 'createdAt'>> & {
  id: string;
};
