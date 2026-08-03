import { ReviewLog, CreateReviewLogInput } from '../entities/review-log';

export interface ReviewLogFilterOptions {
  itemId?: string;
  sessionId?: string;
}

export interface ReviewLogRepository {
  findById(id: string): Promise<ReviewLog | null>;
  list(filter?: ReviewLogFilterOptions): Promise<ReviewLog[]>;
  create(input: CreateReviewLogInput): Promise<ReviewLog>;
  bulkCreate(inputs: CreateReviewLogInput[]): Promise<ReviewLog[]>;
  bulkUpsert(logs: ReviewLog[]): Promise<void>;
  count(filter?: ReviewLogFilterOptions): Promise<number>;
}
