import { LearningItem, CreateLearningItemInput, UpdateLearningItemInput } from '../entities/learning-item';
import { LearningItemType } from '../value-objects/types';

export interface LearningItemFilterOptions {
  deckId?: string;
  type?: LearningItemType;
  tags?: string[];
}

export interface LearningItemRepository {
  findById(id: string): Promise<LearningItem | null>;
  list(filter?: LearningItemFilterOptions): Promise<LearningItem[]>;
  create(input: CreateLearningItemInput): Promise<LearningItem>;
  update(input: UpdateLearningItemInput): Promise<LearningItem>;
  delete(id: string): Promise<boolean>;
  deleteByDeckId(deckId: string): Promise<number>;
  bulkCreate(inputs: CreateLearningItemInput[]): Promise<LearningItem[]>;
  bulkUpsert(items: LearningItem[]): Promise<void>;
  count(filter?: LearningItemFilterOptions): Promise<number>;
}
