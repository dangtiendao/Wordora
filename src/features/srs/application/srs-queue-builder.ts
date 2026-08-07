import { RepositoryContainer } from '@/infrastructure/database/db-factory';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { Deck } from '@/domain/entities/deck';
import { SM2Scheduler } from '../engine/sm2-scheduler';

/**
 * Mục phần tử trong Hàng chờ ôn tập ngắt quãng (SRS Queue Item).
 */
export interface SrsQueueItem {
  item: LearningItem;
  reviewState: ReviewState;
  queueCategory: 'overdue' | 'learning' | 'new';
}

/**
 * Tùy chọn cấu hình truy vấn hàng chờ ôn tập SRS.
 */
export interface SrsQueueOptions {
  deckId?: string;
  dailyNewItemLimit?: number; // default 20
  nowDate?: Date;
}

/**
 * Service ứng dụng dựng Hàng chờ Ôn tập Ngắt quãng (SRS Queue Builder).
 *
 * @remarks
 * - **PRIORITIZATION PIPELINE**:
 *   - Lọc bỏ tất cả các bộ học đã bị lưu trữ (`archivedAt !== null`).
 *   - Phân chia các thẻ học thuộc các bộ học hợp lệ thành 3 phân nhóm:
 *     1. `overdue`: Thẻ đã học và có mốc đến hạn `dueAt <= now` (sắp xếp tăng dần theo `dueAt` - ưu tiên thẻ trễ hạn sâu nhất).
 *     2. `learning`: Thẻ đang nằm trong giai đoạn học ban đầu (`status === 'learning'`) (sắp xếp tăng dần theo `dueAt`).
 *     3. `new`: Thẻ mới chưa từng học (`status === 'new'`), bị giới hạn số lượng theo `dailyNewItemLimit` (mặc định 20 thẻ/ngày).
 *   - Hàng chờ cuối cùng ghép theo thứ tự ưu tiên: `[...overdue, ...learning, ...cappedNew]`.
 */
export class SrsQueueBuilder {
  constructor(private container: RepositoryContainer) {}

  /**
   * Xây dựng danh sách các phần tử cần ôn tập trong ngày.
   *
   * @param options - Cấu hình lọc theo `deckId`, giới hạn thẻ mới và mốc thời gian.
   * @returns Mảng các `SrsQueueItem` đã sắp xếp theo thứ tự ưu tiên làm bài.
   */
  async buildQueue(options?: SrsQueueOptions): Promise<SrsQueueItem[]> {
    const nowDate = options?.nowDate || new Date();
    const nowIso = nowDate.toISOString();
    const newLimit = options?.dailyNewItemLimit ?? 20;

    // 1. Get active (non-archived) decks
    const activeDecks = await this.container.deckRepository.list(false);
    const activeDeckIds = new Set(activeDecks.map((d: Deck) => d.id));

    if (options?.deckId && !activeDeckIds.has(options.deckId)) {
      return []; // Return empty if requested deck is archived
    }

    // 2. Fetch learning items
    const items = await this.container.learningItemRepository.list({
      deckId: options?.deckId,
    });

    const validItems = items.filter((item: LearningItem) => activeDeckIds.has(item.deckId));
    if (validItems.length === 0) return [];

    // 3. Fetch all review states
    const states = await this.container.reviewStateRepository.list();
    const stateMap = new Map<string, ReviewState>(states.map((s: ReviewState) => [s.itemId, s]));

    const overdueDueItems: SrsQueueItem[] = [];
    const learningItems: SrsQueueItem[] = [];
    const newItems: SrsQueueItem[] = [];

    for (const item of validItems) {
      let state = stateMap.get(item.id);
      if (!state) {
        // Default state for items without reviewState record
        state = {
          id: `tmp-${item.id}`,
          itemId: item.id,
          status: 'new',
          easeFactor: SM2Scheduler.DEFAULT_EASE_FACTOR,
          intervalDays: 0,
          repetitions: 0,
          lapses: 0,
          dueAt: nowIso,
          algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
      }

      const currentState = state; // Guaranteed non-undefined

      if (currentState.status === 'new' || currentState.repetitions === 0) {
        newItems.push({
          item,
          reviewState: currentState,
          queueCategory: 'new',
        });
      } else if (currentState.status === 'learning') {
        learningItems.push({
          item,
          reviewState: currentState,
          queueCategory: 'learning',
        });
      } else if (currentState.dueAt && currentState.dueAt <= nowIso) {
        overdueDueItems.push({
          item,
          reviewState: currentState,
          queueCategory: 'overdue',
        });
      }
    }

    // Sort overdue items by dueAt ascending
    overdueDueItems.sort((a, b) => (a.reviewState.dueAt || '').localeCompare(b.reviewState.dueAt || ''));

    // Sort learning items by dueAt ascending
    learningItems.sort((a, b) => (a.reviewState.dueAt || '').localeCompare(b.reviewState.dueAt || ''));

    // Limit new items per daily limit
    const cappedNewItems = newItems.slice(0, newLimit);

    // Final prioritized queue
    return [...overdueDueItems, ...learningItems, ...cappedNewItems];
  }
}

