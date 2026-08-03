import { ReviewState } from '@/domain/entities/review-state';
import { ReviewRating, ReviewStatus } from '@/domain/value-objects/types';

export interface ScheduleResult {
  nextState: ReviewState;
  previousIntervalDays: number;
  nextIntervalDays: number;
  dueAt: string; // ISO 8601 UTC
  status: ReviewStatus;
  algorithmVersion: string;
}

export interface IntervalPreviews {
  again: string; // e.g. "<10m"
  hard: string;  // e.g. "1d"
  good: string;  // e.g. "2d"
  easy: string;  // e.g. "5d"
}

export interface ReviewApplicationInput {
  itemId: string;
  rating: ReviewRating;
  reviewedAt?: string; // Optional ISO 8601 UTC timestamp, defaults to now
  sessionId?: string;
  responseTimeMs?: number;
}
