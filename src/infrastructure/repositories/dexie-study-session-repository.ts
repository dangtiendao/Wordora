import {
  StudySessionRepository,
  StudySessionFilterOptions,
} from '@/domain/repositories/study-session-repository';
import {
  StudySession,
  CreateStudySessionInput,
  UpdateStudySessionInput,
} from '@/domain/entities/study-session';
import { WordoraDatabase } from '../database/wordora-db';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

export class DexieStudySessionRepository implements StudySessionRepository {
  constructor(private db: WordoraDatabase) {}

  async findById(id: string): Promise<StudySession | null> {
    const session = await this.db.studySessions.get(id);
    return session || null;
  }

  async list(filter?: StudySessionFilterOptions): Promise<StudySession[]> {
    let collection = this.db.studySessions.toCollection();

    if (filter?.deckId) {
      collection = this.db.studySessions.where('deckId').equals(filter.deckId);
    } else if (filter?.mode) {
      collection = this.db.studySessions.where('mode').equals(filter.mode);
    }

    let sessions = await collection.toArray();

    if (filter?.deckId && filter?.mode) {
      sessions = sessions.filter((s) => s.mode === filter.mode);
    }

    return sessions;
  }

  async create(input: CreateStudySessionInput): Promise<StudySession> {
    const now = getCurrentISOString();
    const newSession: StudySession = {
      id: input.id || generateUUID(),
      deckId: input.deckId,
      mode: input.mode,
      startedAt: input.startedAt || now,
      completedAt: input.completedAt || null,
      totalQuestions: input.totalQuestions || 0,
      correctAnswers: input.correctAnswers || 0,
      durationSeconds: input.durationSeconds || 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.studySessions.add(newSession);
    return newSession;
  }

  async update(input: UpdateStudySessionInput): Promise<StudySession> {
    const existing = await this.db.studySessions.get(input.id);
    if (!existing) {
      throw new Error(`StudySession not found with id: ${input.id}`);
    }

    const updated: StudySession = {
      ...existing,
      ...input,
      updatedAt: getCurrentISOString(),
    };

    await this.db.studySessions.put(updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.studySessions.get(id);
    if (!existing) return false;

    await this.db.studySessions.delete(id);
    return true;
  }

  async bulkCreate(inputs: CreateStudySessionInput[]): Promise<StudySession[]> {
    const now = getCurrentISOString();
    const newSessions: StudySession[] = inputs.map((input) => ({
      id: input.id || generateUUID(),
      deckId: input.deckId,
      mode: input.mode,
      startedAt: input.startedAt || now,
      completedAt: input.completedAt || null,
      totalQuestions: input.totalQuestions || 0,
      correctAnswers: input.correctAnswers || 0,
      durationSeconds: input.durationSeconds || 0,
      createdAt: now,
      updatedAt: now,
    }));

    await this.db.studySessions.bulkAdd(newSessions);
    return newSessions;
  }

  async bulkUpsert(sessions: StudySession[]): Promise<void> {
    await this.db.studySessions.bulkPut(sessions);
  }

  async count(filter?: StudySessionFilterOptions): Promise<number> {
    const sessions = await this.list(filter);
    return sessions.length;
  }
}
