import { ExerciseType, ReviewRating } from '../value-objects/types';

export interface ReviewLog {
  id: string;
  itemId: string;
  sessionId?: string | null;
  exerciseType: ExerciseType;
  rating: ReviewRating;
  isCorrect: boolean;
  responseTimeMs: number;
  reviewedAt: string; // ISO 8601 UTC
  previousIntervalDays: number;
  nextIntervalDays: number;
  algorithmVersion: string;
}

export type CreateReviewLogInput = Omit<ReviewLog, 'id'> & {
  id?: string;
};
