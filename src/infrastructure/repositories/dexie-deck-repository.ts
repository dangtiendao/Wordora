import { DeckRepository } from '@/domain/repositories/deck-repository';
import { Deck, CreateDeckInput, UpdateDeckInput } from '@/domain/entities/deck';
import { WordoraDatabase } from '../database/wordora-db';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

/**
 * Lớp triển khai Repository Bộ học (DeckRepository) lưu trữ trên IndexedDB thông qua Dexie.js.
 */
export class DexieDeckRepository implements DeckRepository {
  constructor(private db: WordoraDatabase) {}

  /**
   * Tìm bộ học theo ID khoá chính.
   *
   * @param id - Chuỗi UUID v4 của bộ học.
   * @returns Đơn vị Deck nếu tìm thấy, hoặc `null` nếu không tồn tại (not-found semantics).
   */
  async findById(id: string): Promise<Deck | null> {
    const deck = await this.db.decks.get(id);
    return deck || null;
  }

  /**
   * Lấy danh sách bộ học, hỗ trợ ẩn/hiển thị các bộ học đã bị lưu trữ.
   *
   * @param includeArchived - Mặc định `false` (chỉ lấy deck chưa bị lưu trữ `archivedAt === null`).
   * @returns Mảng danh sách các bộ học sắp xếp ngược theo mốc thời gian tạo `createdAt`.
   */
  async list(includeArchived = false): Promise<Deck[]> {
    if (includeArchived) {
      return await this.db.decks.orderBy('createdAt').reverse().toArray();
    }
    return await this.db.decks
      .filter((deck) => !deck.archivedAt)
      .reverse()
      .toArray();
  }

  /**
   * Tạo mới một bộ học và lưu vào IndexedDB.
   *
   * @param input - Dữ liệu khởi tạo bộ học.
   * @returns Đối tượng `Deck` hoàn chỉnh đã được gán `id` UUID v4 và mốc thời gian UTC.
   */
  async create(input: CreateDeckInput): Promise<Deck> {
    const now = getCurrentISOString();
    const newDeck: Deck = {
      id: input.id || generateUUID(),
      name: input.name,
      description: input.description || '',
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      color: input.color || '#10b981',
      icon: input.icon || 'book',
      createdAt: now,
      updatedAt: now,
      archivedAt: input.archivedAt || null,
    };
    await this.db.decks.add(newDeck);
    return newDeck;
  }

  /**
   * Cập nhật thông tin một bộ học hiện có.
   *
   * @param input - Dữ liệu cập nhật kèm `id`.
   * @returns Đối tượng `Deck` sau khi cập nhật.
   * @throws Error nếu không tìm thấy bộ học tương ứng với `input.id`.
   */
  async update(input: UpdateDeckInput): Promise<Deck> {
    const existing = await this.db.decks.get(input.id);
    if (!existing) {
      throw new Error(`Deck not found with id: ${input.id}`);
    }

    const updated: Deck = {
      ...existing,
      ...input,
      updatedAt: getCurrentISOString(),
    };

    await this.db.decks.put(updated);
    return updated;
  }

  /**
   * Xóa cứng (Hard Delete) một bộ học cùng toàn bộ dữ liệu phụ thuộc trong 1 atomic transaction.
   *
   * @remarks
   * - **TRANSACTION BOUNDARY & CASCADE**:
   *   - Thực hiện trong Read-Write Transaction bao gồm các bảng `[decks, learningItems, reviewStates]`.
   *   - Xóa toàn bộ các `ReviewState` thuộc về các mục học trong bộ học này.
   *   - Xóa toàn bộ các `LearningItem` thuộc về bộ học này.
   *   - Xóa bản ghi `Deck` khỏi bảng `decks`.
   *
   * @param id - Chuỗi UUID v4 bộ học cần xóa.
   * @returns `true` nếu xóa thành công, `false` nếu không tìm thấy bộ học.
   */
  async delete(id: string): Promise<boolean> {
    return await this.db.transaction('rw', [this.db.decks, this.db.learningItems, this.db.reviewStates], async () => {
      const existing = await this.db.decks.get(id);
      if (!existing) return false;

      // Delete associated items and review states inside transaction
      const items = await this.db.learningItems.where('deckId').equals(id).toArray();
      const itemIds = items.map((i) => i.id);

      if (itemIds.length > 0) {
        await this.db.reviewStates.where('itemId').anyOf(itemIds).delete();
        await this.db.learningItems.where('deckId').equals(id).delete();
      }

      await this.db.decks.delete(id);
      return true;
    });
  }

  /**
   * Tạo hàng loạt nhiều bộ học mới cùng lúc (`bulkAdd`).
   *
   * @param inputs - Mảng dữ liệu tạo mới bộ học.
   * @returns Mảng các đối tượng `Deck` đã được tạo.
   * @throws Dexie BulkError nếu có ID bị trùng lặp.
   */
  async bulkCreate(inputs: CreateDeckInput[]): Promise<Deck[]> {
    const now = getCurrentISOString();
    const newDecks: Deck[] = inputs.map((input) => ({
      id: input.id || generateUUID(),
      name: input.name,
      description: input.description || '',
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      color: input.color || '#10b981',
      icon: input.icon || 'book',
      createdAt: now,
      updatedAt: now,
      archivedAt: input.archivedAt || null,
    }));

    await this.db.decks.bulkAdd(newDecks);
    return newDecks;
  }

  /**
   * Nạp hoặc đè dữ liệu danh sách bộ học hàng loạt (`bulkPut`).
   *
   * @remarks
   * - **IDEMPOTENCY**: Đảm bảo tính idempotent khi khôi phục từ tệp backup/sync: nếu ID đã tồn tại thì ghi đè (update), chưa có thì tạo mới (insert).
   *
   * @param decks - Mảng đối tượng Deck hoàn chỉnh.
   */
  async bulkUpsert(decks: Deck[]): Promise<void> {
    await this.db.decks.bulkPut(decks);
  }

  /**
   * Đếm tổng số lượng bộ học.
   *
   * @param includeArchived - Mặc định `false` (chỉ đếm deck đang hoạt động).
   * @returns Số lượng bộ học thỏa điều kiện.
   */
  async count(includeArchived = false): Promise<number> {
    if (includeArchived) {
      return await this.db.decks.count();
    }
    return await this.db.decks.filter((deck) => !deck.archivedAt).count();
  }
}

