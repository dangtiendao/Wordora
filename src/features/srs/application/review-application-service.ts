import { RepositoryContainer } from '@/infrastructure/database/db-factory';
import { ReviewApplicationInput, ScheduleResult } from '../domain/srs-types';
import { SM2Scheduler } from '../engine/sm2-scheduler';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

export class ReviewApplicationService {
  constructor(private container: RepositoryContainer) {}

  /**
   * Processes a review rating atomically inside a Dexie transaction.
   */
  async processReview(input: ReviewApplicationInput): Promise<ScheduleResult> {
    const { itemId, rating, sessionId } = input;
    const responseTimeMs = input.responseTimeMs ?? 0;
    const reviewedAt = input.reviewedAt || getCurrentISOString();
    const nowDate = new Date(reviewedAt);

    // 1. Idempotency Guard: Prevent double-submitting within 5 seconds window
    const recentLogs = await this.container.reviewLogRepository.list({ itemId });
    if (recentLogs.length > 0) {
      const lastLog = recentLogs[recentLogs.length - 1];
      const lastLogDate = new Date(lastLog.reviewedAt);
      const timeDiffMs = Math.abs(nowDate.getTime() - lastLogDate.getTime());
      if (timeDiffMs < 5000 && lastLog.rating === rating) {
        // Return current state without duplicating log
        const currentState = (await this.container.reviewStateRepository.findByItemId(itemId)) || {
          id: generateUUID(),
          itemId,
          status: 'new',
          easeFactor: SM2Scheduler.DEFAULT_EASE_FACTOR,
          intervalDays: 0,
          repetitions: 0,
          lapses: 0,
          dueAt: reviewedAt,
          algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
          createdAt: reviewedAt,
          updatedAt: reviewedAt,
        };
        return {
          nextState: currentState,
          previousIntervalDays: currentState.intervalDays,
          nextIntervalDays: currentState.intervalDays,
          dueAt: currentState.dueAt,
          status: currentState.status,
          algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
        };
      }
    }

    // 2. Fetch or initialize ReviewState
    let currentState = await this.container.reviewStateRepository.findByItemId(itemId);
    if (!currentState) {
      currentState = {
        id: generateUUID(),
        itemId,
        status: 'new',
        easeFactor: SM2Scheduler.DEFAULT_EASE_FACTOR,
        intervalDays: 0,
        repetitions: 0,
        lapses: 0,
        dueAt: reviewedAt,
        algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
        createdAt: reviewedAt,
        updatedAt: reviewedAt,
      };
    }

    // 3. Compute next state via SM2Scheduler
    const result = SM2Scheduler.schedule(currentState, rating, nowDate);

    // 4. Atomic Multi-Table Transaction using Dexie DB
    const db = this.container.db;
    await db.transaction('rw', [db.reviewStates, db.reviewLogs], async () => {
      // Save updated ReviewState
      await db.reviewStates.put({
        ...result.nextState,
        updatedAt: reviewedAt,
      });

      // Create new ReviewLog entry
      await db.reviewLogs.add({
        id: generateUUID(),
        itemId,
        sessionId: sessionId || null,
        exerciseType: 'multipleChoice',
        rating,
        isCorrect: rating !== 'again',
        responseTimeMs,
        reviewedAt,
        previousIntervalDays: result.previousIntervalDays,
        nextIntervalDays: result.nextIntervalDays,
        algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
      });
    });

    return result;
  }
}
