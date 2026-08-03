import { StudySession, CreateStudySessionInput, UpdateStudySessionInput } from '../entities/study-session';
import { SessionMode } from '../value-objects/types';

export interface StudySessionFilterOptions {
  deckId?: string;
  mode?: SessionMode;
}

export interface StudySessionRepository {
  findById(id: string): Promise<StudySession | null>;
  list(filter?: StudySessionFilterOptions): Promise<StudySession[]>;
  create(input: CreateStudySessionInput): Promise<StudySession>;
  update(input: UpdateStudySessionInput): Promise<StudySession>;
  delete(id: string): Promise<boolean>;
  bulkCreate(inputs: CreateStudySessionInput[]): Promise<StudySession[]>;
  bulkUpsert(sessions: StudySession[]): Promise<void>;
  count(filter?: StudySessionFilterOptions): Promise<number>;
}
