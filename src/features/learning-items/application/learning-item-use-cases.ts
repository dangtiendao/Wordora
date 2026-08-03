import { LearningItemRepository } from '@/domain/repositories/learning-item-repository';
import { DeckRepository } from '@/domain/repositories/deck-repository';
import { ReviewStateRepository } from '@/domain/repositories/review-state-repository';
import { WordoraDatabase } from '@/infrastructure/database/wordora-db';
import { LearningItem, CreateLearningItemInput, UpdateLearningItemInput } from '@/domain/entities/learning-item';
import { LearningItemType } from '@/domain/value-objects/types';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

export interface ListLearningItemsOptions {
  deckId: string;
  type?: LearningItemType | 'all';
  difficulty?: number;
  tag?: string;
  searchQuery?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'prompt';
  sortOrder?: 'asc' | 'desc';
}

export function normalizeTags(tagsInput?: string[] | string): string[] {
  if (!tagsInput) return [];

  let rawList: string[] = [];
  if (typeof tagsInput === 'string') {
    rawList = tagsInput.split(',');
  } else if (Array.isArray(tagsInput)) {
    rawList = tagsInput;
  }

  const cleaned = rawList
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  // Return unique tags maintaining case
  return Array.from(new Set(cleaned));
}

export class LearningItemUseCases {
  constructor(
    private itemRepo: LearningItemRepository,
    private deckRepo: DeckRepository,
    private reviewStateRepo: ReviewStateRepository,
    private db: WordoraDatabase
  ) {}

  async createLearningItem(input: CreateLearningItemInput): Promise<LearningItem> {
    const deck = await this.deckRepo.findById(input.deckId);
    if (!deck) {
      throw new Error('Bộ học không tồn tại hoặc đã bị xóa.');
    }

    const trimmedPrompt = input.prompt.trim();
    const trimmedAnswer = input.answer.trim();

    if (!trimmedPrompt) {
      throw new Error('Nội dung cần học không được để trống.');
    }
    if (!trimmedAnswer) {
      throw new Error('Đáp án / nghĩa không được để trống.');
    }

    const cleanTags = normalizeTags(input.tags);
    const now = getCurrentISOString();
    const itemId = input.id || generateUUID();

    // Transactionally create LearningItem + initial ReviewState ('new')
    return await this.db.transaction('rw', [this.db.learningItems, this.db.reviewStates], async () => {
      const newItem: LearningItem = {
        id: itemId,
        deckId: input.deckId,
        type: input.type,
        prompt: trimmedPrompt,
        answer: trimmedAnswer,
        phonetic: input.phonetic?.trim() || '',
        example: input.example?.trim() || '',
        exampleTranslation: input.exampleTranslation?.trim() || '',
        note: input.note?.trim() || '',
        partOfSpeech: input.partOfSpeech?.trim() || '',
        difficulty: input.difficulty || 3,
        tags: cleanTags,
        createdAt: now,
        updatedAt: now,
      };

      await this.db.learningItems.add(newItem);

      // Create initial ReviewState
      await this.db.reviewStates.add({
        id: generateUUID(),
        itemId,
        status: 'new',
        dueAt: now,
        intervalDays: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        lastRating: null,
        lastReviewedAt: null,
        algorithmVersion: 'sm2-v1',
        createdAt: now,
        updatedAt: now,
      });

      return newItem;
    });
  }

  async updateLearningItem(input: UpdateLearningItemInput): Promise<LearningItem> {
    const existing = await this.itemRepo.findById(input.id);
    if (!existing) {
      throw new Error('Mục học tập không tồn tại.');
    }

    if (input.prompt !== undefined) {
      const trimmedPrompt = input.prompt.trim();
      if (!trimmedPrompt) throw new Error('Nội dung cần học không được để trống.');
      input.prompt = trimmedPrompt;
    }

    if (input.answer !== undefined) {
      const trimmedAnswer = input.answer.trim();
      if (!trimmedAnswer) throw new Error('Đáp án / nghĩa không được để trống.');
      input.answer = trimmedAnswer;
    }

    if (input.tags !== undefined) {
      input.tags = normalizeTags(input.tags);
    }

    if (input.phonetic !== undefined) input.phonetic = input.phonetic.trim();
    if (input.example !== undefined) input.example = input.example.trim();
    if (input.exampleTranslation !== undefined) input.exampleTranslation = input.exampleTranslation.trim();
    if (input.note !== undefined) input.note = input.note.trim();
    if (input.partOfSpeech !== undefined) input.partOfSpeech = input.partOfSpeech.trim();

    return await this.itemRepo.update(input);
  }

  async deleteLearningItem(id: string): Promise<boolean> {
    const existing = await this.itemRepo.findById(id);
    if (!existing) {
      throw new Error('Mục học tập không tồn tại.');
    }

    return await this.itemRepo.delete(id);
  }

  async bulkDeleteLearningItems(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    return await this.db.transaction(
      'rw',
      [this.db.learningItems, this.db.reviewStates, this.db.reviewLogs, this.db.recordings],
      async () => {
        await this.db.reviewStates.where('itemId').anyOf(ids).delete();
        await this.db.reviewLogs.where('itemId').anyOf(ids).delete();
        await this.db.recordings.where('itemId').anyOf(ids).delete();
        return await this.db.learningItems.where('id').anyOf(ids).delete();
      }
    );
  }

  async duplicateLearningItem(id: string): Promise<LearningItem> {
    const existing = await this.itemRepo.findById(id);
    if (!existing) {
      throw new Error('Mục học tập không tồn tại.');
    }

    // Create a new duplicate with a fresh prompt marker & fresh ReviewState
    return await this.createLearningItem({
      deckId: existing.deckId,
      type: existing.type,
      prompt: `${existing.prompt} (Bản sao)`,
      answer: existing.answer,
      phonetic: existing.phonetic,
      example: existing.example,
      exampleTranslation: existing.exampleTranslation,
      note: existing.note,
      partOfSpeech: existing.partOfSpeech,
      difficulty: existing.difficulty,
      tags: [...existing.tags],
    });
  }

  async getLearningItem(id: string): Promise<LearningItem | null> {
    return await this.itemRepo.findById(id);
  }

  async listLearningItems(options: ListLearningItemsOptions): Promise<LearningItem[]> {
    let items = await this.itemRepo.list({ deckId: options.deckId });

    // Filter by type
    if (options.type && options.type !== 'all') {
      items = items.filter((i) => i.type === options.type);
    }

    // Filter by difficulty
    if (options.difficulty && options.difficulty > 0) {
      items = items.filter((i) => i.difficulty === options.difficulty);
    }

    // Filter by tag
    if (options.tag) {
      const tagQuery = options.tag.toLowerCase();
      items = items.filter((i) => i.tags.some((t) => t.toLowerCase() === tagQuery));
    }

    // Filter by search query
    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.prompt.toLowerCase().includes(q) ||
          i.answer.toLowerCase().includes(q) ||
          (i.phonetic && i.phonetic.toLowerCase().includes(q)) ||
          (i.example && i.example.toLowerCase().includes(q)) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort items
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'prompt') {
        comparison = a.prompt.localeCompare(b.prompt, 'vi');
      } else if (sortBy === 'updatedAt') {
        comparison = a.updatedAt.localeCompare(b.updatedAt);
      } else {
        comparison = a.createdAt.localeCompare(b.createdAt);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return items;
  }
}
