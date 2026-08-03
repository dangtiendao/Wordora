import { ReviewStatus, ReviewRating } from '../value-objects/types';

export interface ReviewState {
  id: string;
  itemId: string;
  status: ReviewStatus;
  dueAt: string; // ISO 8601 UTC
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  lastRating?: ReviewRating | null;
  lastReviewedAt?: string | null; // ISO 8601 UTC
  algorithmVersion: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}

export type CreateReviewStateInput = Omit<ReviewState, 'id' | 'createdAt' | 'updatedAt' | 'algorithmVersion'> & {
  id?: string;
  algorithmVersion?: string;
};

export type UpdateReviewStateInput = Partial<Omit<ReviewState, 'id' | 'createdAt'>> & {
  id: string;
};
