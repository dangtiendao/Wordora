import { ReviewState } from '@/domain/entities/review-state';
import { ReviewRating, ReviewStatus } from '@/domain/value-objects/types';
import { ScheduleResult, IntervalPreviews } from '../domain/srs-types';

export class SM2Scheduler {
  static readonly ALGORITHM_VERSION = '1.0.0';
  static readonly MIN_EASE_FACTOR = 1.3;
  static readonly MAX_EASE_FACTOR = 3.5;
  static readonly DEFAULT_EASE_FACTOR = 2.5;
  static readonly MAX_INTERVAL_DAYS = 365;

  /**
   * Pure SM-2 scheduling calculation.
   */
  static schedule(
    currentState: ReviewState,
    rating: ReviewRating,
    nowDate: Date = new Date()
  ): ScheduleResult {
    const previousIntervalDays = currentState.intervalDays || 0;
    let easeFactor = currentState.easeFactor || this.DEFAULT_EASE_FACTOR;
    let repetitions = currentState.repetitions || 0;
    let lapses = currentState.lapses || 0;
    let nextIntervalDays = 0;
    let status: ReviewStatus = currentState.status || 'new';

    // 1. Calculate new Ease Factor (EF)
    // q: again = 1, hard = 2, good = 3, easy = 4
    const qMap: Record<ReviewRating, number> = {
      again: 1,
      hard: 2,
      good: 3,
      easy: 4,
    };
    const q = qMap[rating];

    if (rating === 'again') {
      easeFactor = Math.max(this.MIN_EASE_FACTOR, easeFactor - 0.2);
    } else {
      easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      easeFactor = Math.max(this.MIN_EASE_FACTOR, Math.min(this.MAX_EASE_FACTOR, easeFactor));
    }

    // 2. State & Interval Calculations
    if (rating === 'again') {
      lapses += 1;
      repetitions = 0;
      nextIntervalDays = 0;
      status = 'learning';
    } else if (repetitions === 0) {
      // First successful review from new/learning
      repetitions = 1;
      if (rating === 'hard') {
        nextIntervalDays = 1;
        status = 'learning';
      } else if (rating === 'good') {
        nextIntervalDays = 2;
        status = 'review';
      } else {
        // easy
        nextIntervalDays = 5;
        status = 'review';
      }
    } else {
      // Subsequent review
      repetitions += 1;
      status = 'review';
      if (rating === 'hard') {
        nextIntervalDays = Math.max(1, Math.round(previousIntervalDays * 1.2));
      } else if (rating === 'good') {
        nextIntervalDays = Math.max(1, Math.round(previousIntervalDays * easeFactor));
      } else {
        // easy
        nextIntervalDays = Math.max(1, Math.round(previousIntervalDays * easeFactor * 1.3));
      }
    }

    // Clamp maximum interval
    nextIntervalDays = Math.min(this.MAX_INTERVAL_DAYS, nextIntervalDays);

    // 3. Check for Mastered Status
    if (repetitions >= 5 && nextIntervalDays >= 30) {
      status = 'mastered';
    }

    // 4. Calculate Due Date (dueAt)
    let dueAtDate: Date;
    if (rating === 'again') {
      // Due in 10 minutes for 'again'
      dueAtDate = new Date(nowDate.getTime() + 10 * 60 * 1000);
    } else {
      dueAtDate = new Date(nowDate.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);
    }

    const dueAt = dueAtDate.toISOString();
    const lastReviewedAt = nowDate.toISOString();

    const nextState: ReviewState = {
      ...currentState,
      status,
      easeFactor,
      intervalDays: nextIntervalDays,
      repetitions,
      lapses,
      dueAt,
      lastReviewedAt,
      updatedAt: lastReviewedAt,
    };

    return {
      nextState,
      previousIntervalDays,
      nextIntervalDays,
      dueAt,
      status,
      algorithmVersion: this.ALGORITHM_VERSION,
    };
  }

  /**
   * Calculates interval previews for UI buttons (e.g. "<10m", "1d", "2d", "5d").
   */
  static previewIntervals(currentState: ReviewState, nowDate: Date = new Date()): IntervalPreviews {
    const hardRes = this.schedule(currentState, 'hard', nowDate);
    const goodRes = this.schedule(currentState, 'good', nowDate);
    const easyRes = this.schedule(currentState, 'easy', nowDate);

    const formatDays = (days: number, fallback: string) => {
      if (days === 0) return fallback;
      return `${days}d`;
    };

    return {
      again: '<10m',
      hard: formatDays(hardRes.nextIntervalDays, '1d'),
      good: formatDays(goodRes.nextIntervalDays, '2d'),
      easy: formatDays(easyRes.nextIntervalDays, '5d'),
    };
  }
}
