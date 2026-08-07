import {
  ReviewStateRepository,
  ReviewStateFilterOptions,
} from '@/domain/repositories/review-state-repository';
import {
  ReviewState,
  CreateReviewStateInput,
  UpdateReviewStateInput,
} from '@/domain/entities/review-state';
import { WordoraDatabase } from '../database/wordora-db';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

/**
 * Lớp triển khai Repository Trạng thái ôn tập ngắt quãng (ReviewStateRepository) trên Dexie.js.
 */
export class DexieReviewStateRepository implements ReviewStateRepository {
  constructor(private db: WordoraDatabase) {}

  /**
   * Tìm trạng thái ôn tập theo ID khoá chính.
   */
  async findById(id: string): Promise<ReviewState | null> {
    const state = await this.db.reviewStates.get(id);
    return state || null;
  }

  /**
   * Truy vấn trạng thái ôn tập theo `itemId` của thẻ học (Quan hệ 1:1).
   */
  async findByItemId(itemId: string): Promise<ReviewState | null> {
    const state = await this.db.reviewStates.where('itemId').equals(itemId).first();
    return state || null;
  }

  /**
   * Lấy danh sách trạng thái ôn tập theo bộ lọc (`itemId`, `status`, hoặc `dueBefore`).
   *
   * @remarks
   * - **SRS DUE ITEMS QUERY**: Lọc các thẻ học có mốc thời gian `dueAt <= dueBefore` để phục vụ lấy danh sách thẻ cần ôn tập ngắt quãng trong ngày.
   */
  async list(filter?: ReviewStateFilterOptions): Promise<ReviewState[]> {
    let collection = this.db.reviewStates.toCollection();

    if (filter?.itemId) {
      collection = this.db.reviewStates.where('itemId').equals(filter.itemId);
    } else if (filter?.status) {
      collection = this.db.reviewStates.where('status').equals(filter.status);
    }

    let states = await collection.toArray();

    if (filter?.status && filter?.itemId) {
      states = states.filter((s) => s.status === filter.status);
    }

    if (filter?.dueBefore) {
      const dueIso = filter.dueBefore;
      states = states.filter((s) => s.dueAt <= dueIso);
    }

    return states;
  }

  /**
   * Khởi tạo trạng thái ôn tập mới cho thẻ học.
   */
  async create(input: CreateReviewStateInput): Promise<ReviewState> {
    const now = getCurrentISOString();
    const newState: ReviewState = {
      id: input.id || generateUUID(),
      itemId: input.itemId,
      status: input.status,
      dueAt: input.dueAt,
      intervalDays: input.intervalDays,
      easeFactor: input.easeFactor,
      repetitions: input.repetitions,
      lapses: input.lapses,
      lastRating: input.lastRating || null,
      lastReviewedAt: input.lastReviewedAt || null,
      algorithmVersion: input.algorithmVersion || 'sm2-v1',
      createdAt: now,
      updatedAt: now,
    };

    await this.db.reviewStates.add(newState);
    return newState;
  }

  /**
   * Cập nhật thông số trạng thái ôn tập (interval, easeFactor, dueAt, status) sau lượt ôn.
   */
  async update(input: UpdateReviewStateInput): Promise<ReviewState> {
    const existing = await this.db.reviewStates.get(input.id);
    if (!existing) {
      throw new Error(`ReviewState not found with id: ${input.id}`);
    }

    const updated: ReviewState = {
      ...existing,
      ...input,
      updatedAt: getCurrentISOString(),
    };

    await this.db.reviewStates.put(updated);
    return updated;
  }

  /**
   * Xóa bản ghi trạng thái ôn tập theo ID.
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.db.reviewStates.get(id);
    if (!existing) return false;

    await this.db.reviewStates.delete(id);
    return true;
  }

  /**
   * Xóa bản ghi trạng thái ôn tập tương ứng với `itemId`.
   */
  async deleteByItemId(itemId: string): Promise<boolean> {
    const count = await this.db.reviewStates.where('itemId').equals(itemId).delete();
    return count > 0;
  }

  /**
   * Khởi tạo hàng loạt các trạng thái ôn tập (`bulkAdd`).
   */
  async bulkCreate(inputs: CreateReviewStateInput[]): Promise<ReviewState[]> {
    const now = getCurrentISOString();
    const newStates: ReviewState[] = inputs.map((input) => ({
      id: input.id || generateUUID(),
      itemId: input.itemId,
      status: input.status,
      dueAt: input.dueAt,
      intervalDays: input.intervalDays,
      easeFactor: input.easeFactor,
      repetitions: input.repetitions,
      lapses: input.lapses,
      lastRating: input.lastRating || null,
      lastReviewedAt: input.lastReviewedAt || null,
      algorithmVersion: input.algorithmVersion || 'sm2-v1',
      createdAt: now,
      updatedAt: now,
    }));

    await this.db.reviewStates.bulkAdd(newStates);
    return newStates;
  }

  /**
   * Nạp đè dữ liệu hàng loạt trạng thái ôn tập (`bulkPut`).
   */
  async bulkUpsert(states: ReviewState[]): Promise<void> {
    await this.db.reviewStates.bulkPut(states);
  }

  /**
   * Đếm tổng số bản ghi trạng thái ôn tập theo bộ lọc.
   */
  async count(filter?: ReviewStateFilterOptions): Promise<number> {
    const states = await this.list(filter);
    return states.length;
  }
}

