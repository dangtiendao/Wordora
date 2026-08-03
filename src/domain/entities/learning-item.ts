import { LearningItemType } from '../value-objects/types';

export interface LearningItem {
  id: string;
  deckId: string;
  type: LearningItemType;
  prompt: string;
  answer: string;
  phonetic?: string;
  example?: string;
  exampleTranslation?: string;
  note?: string;
  partOfSpeech?: string;
  difficulty?: number; // 1 (easy) to 5 (hard)
  tags: string[];
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}

export type CreateLearningItemInput = Omit<LearningItem, 'id' | 'createdAt' | 'updatedAt' | 'tags'> & {
  id?: string;
  tags?: string[];
};

export type UpdateLearningItemInput = Partial<Omit<LearningItem, 'id' | 'createdAt'>> & {
  id: string;
};
