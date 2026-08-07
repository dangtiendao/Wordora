import { StudySessionRepository } from '@/domain/repositories/study-session-repository';
import { StudySession } from '@/domain/entities/study-session';
import { getCurrentISOString } from '@/lib/date';

/**
 * Payload dữ liệu nộp hoàn tất phiên học.
 */
export interface CompleteStudySessionInput {
  deckId: string;
  totalCards: number;
  startedAt: string;
  ratings: Record<number, number>; // Rating 1, 2, 3, 4 count breakdown
  mode?: 'flashcard';
}

/**
 * Application Use Cases quản lý các hoạt động ghi nhận Phiên học (StudyUseCases).
 */
export class StudyUseCases {
  constructor(private studySessionRepo: StudySessionRepository) {}

  /**
   * Tính toán chỉ số và ghi nhận hoàn thành một Phiên học vào cơ sở dữ liệu.
   *
   * @remarks
   * - **METRICS CALCULATION**:
   *   - `durationSeconds`: Tính thời lượng thực hiện phiên học tính theo giây (`(completedAt - startedAt) / 1000`, tối thiểu 1 giây).
   *   - `correctAnswers`: Tổng hợp từ số đợt chọn mức `good` (rating 3) và `easy` (rating 4) làm số câu trả lời đúng.
   *
   * @param input - Thông tin kết quả phiên học.
   * @returns Bản ghi `StudySession` đã được lưu trữ.
   */
  async completeStudySession(input: CompleteStudySessionInput): Promise<StudySession> {
    const completedAt = getCurrentISOString();
    const startTime = new Date(input.startedAt).getTime();
    const endTime = new Date(completedAt).getTime();
    const durationSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));

    const goodCount = input.ratings[3] || 0;
    const easyCount = input.ratings[4] || 0;
    const correctCards = goodCount + easyCount;

    return await this.studySessionRepo.create({
      deckId: input.deckId,
      mode: input.mode || 'flashcard',
      startedAt: input.startedAt,
      completedAt,
      totalQuestions: input.totalCards,
      correctAnswers: correctCards,
      durationSeconds,
    });
  }

  /**
   * Truy vấn danh sách các phiên học đã lưu (lọc theo `deckId` nếu được cung cấp).
   */
  async listStudySessions(deckId?: string): Promise<StudySession[]> {
    return await this.studySessionRepo.list({ deckId });
  }
}

