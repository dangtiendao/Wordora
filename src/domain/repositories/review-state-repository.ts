import { ReviewState, CreateReviewStateInput, UpdateReviewStateInput } from '../entities/review-state';
import { ReviewStatus } from '../value-objects/types';

export interface ReviewStateFilterOptions {
  itemId?: string;
  status?: ReviewStatus;
  dueBefore?: string; // ISO 8601 UTC
}

export interface ReviewStateRepository {
  findById(id: string): Promise<ReviewState | null>;
  findByItemId(itemId: string): Promise<ReviewState | null>;
  list(filter?: ReviewStateFilterOptions): Promise<ReviewState[]>;
  create(input: CreateReviewStateInput): Promise<ReviewState>;
  update(input: UpdateReviewStateInput): Promise<ReviewState>;
  delete(id: string): Promise<boolean>;
  deleteByItemId(itemId: string): Promise<boolean>;
  bulkCreate(inputs: CreateReviewStateInput[]): Promise<ReviewState[]>;
  bulkUpsert(states: ReviewState[]): Promise<void>;
  count(filter?: ReviewStateFilterOptions): Promise<number>;
}
