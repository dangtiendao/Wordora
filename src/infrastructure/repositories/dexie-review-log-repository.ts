import {
  ReviewLogRepository,
  ReviewLogFilterOptions,
} from '@/domain/repositories/review-log-repository';
import { ReviewLog, CreateReviewLogInput } from '@/domain/entities/review-log';
import { WordoraDatabase } from '../database/wordora-db';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

export class DexieReviewLogRepository implements ReviewLogRepository {
  constructor(private db: WordoraDatabase) {}

  async findById(id: string): Promise<ReviewLog | null> {
    const log = await this.db.reviewLogs.get(id);
    return log || null;
  }

  async list(filter?: ReviewLogFilterOptions): Promise<ReviewLog[]> {
    let collection = this.db.reviewLogs.toCollection();

    if (filter?.itemId) {
      collection = this.db.reviewLogs.where('itemId').equals(filter.itemId);
    } else if (filter?.sessionId) {
      collection = this.db.reviewLogs.where('sessionId').equals(filter.sessionId);
    }

    let logs = await collection.toArray();

    if (filter?.itemId && filter?.sessionId) {
      logs = logs.filter((l) => l.sessionId === filter.sessionId);
    }

    return logs;
  }

  async create(input: CreateReviewLogInput): Promise<ReviewLog> {
    const newLog: ReviewLog = {
      id: input.id || generateUUID(),
      itemId: input.itemId,
      sessionId: input.sessionId || null,
      exerciseType: input.exerciseType,
      rating: input.rating,
      isCorrect: input.isCorrect,
      responseTimeMs: input.responseTimeMs,
      reviewedAt: input.reviewedAt || getCurrentISOString(),
      previousIntervalDays: input.previousIntervalDays,
      nextIntervalDays: input.nextIntervalDays,
      algorithmVersion: input.algorithmVersion || 'sm2-v1',
    };

    await this.db.reviewLogs.add(newLog);
    return newLog;
  }

  async bulkCreate(inputs: CreateReviewLogInput[]): Promise<ReviewLog[]> {
    const now = getCurrentISOString();
    const newLogs: ReviewLog[] = inputs.map((input) => ({
      id: input.id || generateUUID(),
      itemId: input.itemId,
      sessionId: input.sessionId || null,
      exerciseType: input.exerciseType,
      rating: input.rating,
      isCorrect: input.isCorrect,
      responseTimeMs: input.responseTimeMs,
      reviewedAt: input.reviewedAt || now,
      previousIntervalDays: input.previousIntervalDays,
      nextIntervalDays: input.nextIntervalDays,
      algorithmVersion: input.algorithmVersion || 'sm2-v1',
    }));

    await this.db.reviewLogs.bulkAdd(newLogs);
    return newLogs;
  }

  async bulkUpsert(logs: ReviewLog[]): Promise<void> {
    await this.db.reviewLogs.bulkPut(logs);
  }

  async count(filter?: ReviewLogFilterOptions): Promise<number> {
    const logs = await this.list(filter);
    return logs.length;
  }
}
