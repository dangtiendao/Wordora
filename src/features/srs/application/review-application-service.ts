import { RepositoryContainer } from '@/infrastructure/database/db-factory';
import { ReviewApplicationInput, ScheduleResult } from '../domain/srs-types';
import { SM2Scheduler } from '../engine/sm2-scheduler';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

/**
 * Application Service điều phối và xử lý quy trình nộp kết quả đánh giá lượt ôn tập (Review Application Service).
 *
 * @remarks
 * - **IDEMPOTENCY & DOUBLE-SUBMIT GUARD**:
 *   - Lấy lịch sử `ReviewLog` gần nhất của mục học (`itemId`). Nếu lượt đánh giá vừa được thực hiện trong vòng **5 giây** (`< 5000ms`) với cùng mức `rating`, hàm sẽ trả về kết quả hiện tại ngay lập tức mà KHÔNG ghi thêm bản ghi log trùng lặp.
 * - **ATOMIC TRANSACTION**:
 *   - Cập nhật bản ghi `ReviewState` mới và chèn bản ghi `ReviewLog` nhật ký trong 1 atomic Read-Write transaction duy nhất trên Dexie (`[db.reviewStates, db.reviewLogs]`).
 */
export class ReviewApplicationService {
  constructor(private container: RepositoryContainer) {}

  /**
   * Xử lý lượt ôn tập một mục học theo đánh giá của người dùng.
   *
   * @param input - Thông tin lượt đánh giá (`itemId`, `rating`, `sessionId`, `responseTimeMs`, `reviewedAt`).
   * @returns Kết quả `ScheduleResult` chứa `nextState` và các mốc thời gian đã cập nhật.
   */
  async processReview(input: ReviewApplicationInput): Promise<ScheduleResult> {
    const { itemId, rating, sessionId } = input;
    const responseTimeMs = input.responseTimeMs ?? 0;
    const reviewedAt = input.reviewedAt || getCurrentISOString();
    const nowDate = new Date(reviewedAt);

    // 1. Idempotency Guard: Prevent double-submitting within 5 seconds window
    const recentLogs = await this.container.reviewLogRepository.list({ itemId });
    if (recentLogs.length > 0) {
      const lastLog = recentLogs[recentLogs.length - 1];
      const lastLogDate = new Date(lastLog.reviewedAt);
      const timeDiffMs = Math.abs(nowDate.getTime() - lastLogDate.getTime());
      if (timeDiffMs < 5000 && lastLog.rating === rating) {
        // Return current state without duplicating log
        const currentState = (await this.container.reviewStateRepository.findByItemId(itemId)) || {
          id: generateUUID(),
          itemId,
          status: 'new',
          easeFactor: SM2Scheduler.DEFAULT_EASE_FACTOR,
          intervalDays: 0,
          repetitions: 0,
          lapses: 0,
          dueAt: reviewedAt,
          algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
          createdAt: reviewedAt,
          updatedAt: reviewedAt,
        };
        return {
          nextState: currentState,
          previousIntervalDays: currentState.intervalDays,
          nextIntervalDays: currentState.intervalDays,
          dueAt: currentState.dueAt,
          status: currentState.status,
          algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
        };
      }
    }

    // 2. Fetch or initialize ReviewState
    let currentState = await this.container.reviewStateRepository.findByItemId(itemId);
    if (!currentState) {
      currentState = {
        id: generateUUID(),
        itemId,
        status: 'new',
        easeFactor: SM2Scheduler.DEFAULT_EASE_FACTOR,
        intervalDays: 0,
        repetitions: 0,
        lapses: 0,
        dueAt: reviewedAt,
        algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
        createdAt: reviewedAt,
        updatedAt: reviewedAt,
      };
    }

    // 3. Compute next state via SM2Scheduler
    const result = SM2Scheduler.schedule(currentState, rating, nowDate);

    // 4. Atomic Multi-Table Transaction using Dexie DB
    const db = this.container.db;
    await db.transaction('rw', [db.reviewStates, db.reviewLogs], async () => {
      // Save updated ReviewState
      await db.reviewStates.put({
        ...result.nextState,
        updatedAt: reviewedAt,
      });

      // Create new ReviewLog entry
      await db.reviewLogs.add({
        id: generateUUID(),
        itemId,
        sessionId: sessionId || null,
        exerciseType: 'multipleChoice',
        rating,
        isCorrect: rating !== 'again',
        responseTimeMs,
        reviewedAt,
        previousIntervalDays: result.previousIntervalDays,
        nextIntervalDays: result.nextIntervalDays,
        algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
      });
    });

    return result;
  }
}

