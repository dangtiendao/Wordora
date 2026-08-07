import {
  LearningItemRepository,
  LearningItemFilterOptions,
} from '@/domain/repositories/learning-item-repository';
import {
  LearningItem,
  CreateLearningItemInput,
  UpdateLearningItemInput,
} from '@/domain/entities/learning-item';
import { WordoraDatabase } from '../database/wordora-db';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

/**
 * Lớp triển khai Repository Mục học (LearningItemRepository) sử dụng IndexedDB/Dexie.
 */
export class DexieLearningItemRepository implements LearningItemRepository {
  constructor(private db: WordoraDatabase) {}

  /**
   * Tìm thẻ học theo ID khoá chính.
   */
  async findById(id: string): Promise<LearningItem | null> {
    const item = await this.db.learningItems.get(id);
    return item || null;
  }

  /**
   * Truy vấn danh sách thẻ học theo các tiêu chí lọc.
   *
   * @remarks
   * - Tận dụng index `deckId` để query từ Dexie Collection nếu `filter.deckId` được cung cấp.
   * - Thực hiện lọc trong bộ nhớ cho các tiêu chí `type` và `tags` (match tất cả các tag trong `filter.tags`).
   */
  async list(filter?: LearningItemFilterOptions): Promise<LearningItem[]> {
    let collection = this.db.learningItems.toCollection();

    if (filter?.deckId) {
      collection = this.db.learningItems.where('deckId').equals(filter.deckId);
    }

    let items = await collection.toArray();

    if (filter?.type) {
      items = items.filter((i) => i.type === filter.type);
    }

    if (filter?.tags && filter.tags.length > 0) {
      const filterTags = filter.tags;
      items = items.filter((i) => filterTags.every((tag) => i.tags.includes(tag)));
    }

    return items;
  }

  /**
   * Tạo mới một thẻ học trong cơ sở dữ liệu.
   */
  async create(input: CreateLearningItemInput): Promise<LearningItem> {
    const now = getCurrentISOString();
    const newItem: LearningItem = {
      id: input.id || generateUUID(),
      deckId: input.deckId,
      type: input.type,
      prompt: input.prompt,
      answer: input.answer,
      phonetic: input.phonetic || '',
      example: input.example || '',
      exampleTranslation: input.exampleTranslation || '',
      note: input.note || '',
      partOfSpeech: input.partOfSpeech || '',
      difficulty: input.difficulty || 3,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    await this.db.learningItems.add(newItem);
    return newItem;
  }

  /**
   * Cập nhật thông tin thẻ học.
   *
   * @throws Error nếu không tìm thấy `input.id`.
   */
  async update(input: UpdateLearningItemInput): Promise<LearningItem> {
    const existing = await this.db.learningItems.get(input.id);
    if (!existing) {
      throw new Error(`LearningItem not found with id: ${input.id}`);
    }

    const updated: LearningItem = {
      ...existing,
      ...input,
      updatedAt: getCurrentISOString(),
    };

    await this.db.learningItems.put(updated);
    return updated;
  }

  /**
   * Xóa một thẻ học cùng toàn bộ bản ghi `ReviewState` và `Recording` phụ thuộc trong 1 atomic transaction.
   *
   * @remarks
   * - **TRANSACTION BOUNDARY & CASCADE**:
   *   - Transaction bao gồm `[learningItems, reviewStates, recordings]`.
   *   - Xóa `ReviewState` có `itemId == id`.
   *   - Xóa tất cả `Recording` có `itemId == id`.
   *   - Xóa bản ghi `LearningItem`.
   */
  async delete(id: string): Promise<boolean> {
    return await this.db.transaction(
      'rw',
      [this.db.learningItems, this.db.reviewStates, this.db.recordings],
      async () => {
        const existing = await this.db.learningItems.get(id);
        if (!existing) return false;

        await this.db.reviewStates.where('itemId').equals(id).delete();
        await this.db.recordings.where('itemId').equals(id).delete();
        await this.db.learningItems.delete(id);
        return true;
      }
    );
  }

  /**
   * Xóa toàn bộ các thẻ học thuộc về một Bộ học (`deckId`) trong 1 atomic transaction.
   *
   * @returns Số lượng thẻ học đã bị xóa.
   */
  async deleteByDeckId(deckId: string): Promise<number> {
    return await this.db.transaction(
      'rw',
      [this.db.learningItems, this.db.reviewStates, this.db.recordings],
      async () => {
        const items = await this.db.learningItems.where('deckId').equals(deckId).toArray();
        const itemIds = items.map((i) => i.id);

        if (itemIds.length > 0) {
          await this.db.reviewStates.where('itemId').anyOf(itemIds).delete();
          await this.db.recordings.where('itemId').anyOf(itemIds).delete();
        }

        return await this.db.learningItems.where('deckId').equals(deckId).delete();
      }
    );
  }

  /**
   * Tạo hàng loạt nhiều thẻ học mới (`bulkAdd`).
   */
  async bulkCreate(inputs: CreateLearningItemInput[]): Promise<LearningItem[]> {
    const now = getCurrentISOString();
    const newItems: LearningItem[] = inputs.map((input) => ({
      id: input.id || generateUUID(),
      deckId: input.deckId,
      type: input.type,
      prompt: input.prompt,
      answer: input.answer,
      phonetic: input.phonetic || '',
      example: input.example || '',
      exampleTranslation: input.exampleTranslation || '',
      note: input.note || '',
      partOfSpeech: input.partOfSpeech || '',
      difficulty: input.difficulty || 3,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
    }));

    await this.db.learningItems.bulkAdd(newItems);
    return newItems;
  }

  /**
   * Nạp hoặc đè dữ liệu thẻ học hàng loạt (`bulkPut`).
   *
   * @remarks
   * - **IDEMPOTENCY**: Đảm bảo tính idempotent khi khôi phục dữ liệu từ backup.
   */
  async bulkUpsert(items: LearningItem[]): Promise<void> {
    await this.db.learningItems.bulkPut(items);
  }

  /**
   * Đếm số lượng thẻ học thỏa mãn bộ lọc.
   */
  async count(filter?: LearningItemFilterOptions): Promise<number> {
    const items = await this.list(filter);
    return items.length;
  }
}

