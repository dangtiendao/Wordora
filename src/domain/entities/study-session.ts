import { SessionMode } from '../value-objects/types';

/**
 * Phiên học / Luyện tập (StudySession) - Đánh dấu một đợt làm bài tập hoặc ôn lật thẻ.
 *
 * @remarks
 * - **BUSINESS RULE**:
 *   - Gắn liền với một `Deck` thông qua `deckId`.
 *   - `completedAt`: Mốc thời gian kết thúc phiên làm bài. Nếu là `null`/`undefined`, phiên học đang dở dang hoặc chưa hoàn tất.
 *   - Theo dõi kết quả tổng hợp: `totalQuestions`, `correctAnswers`, và `durationSeconds`.
 * - **INVARIANT**:
 *   - `id` và `deckId` phải là chuỗi UUID v4.
 *   - `startedAt`, `completedAt`, `createdAt`, `updatedAt` bắt buộc theo định dạng chuỗi ISO 8601 UTC.
 *   - Điều kiện luôn đúng: `correctAnswers` <= `totalQuestions`.
 */
export interface StudySession {
  id: string;
  deckId: string;
  mode: SessionMode;
  startedAt: string; // ISO 8601 UTC
  completedAt?: string | null; // ISO 8601 UTC if completed
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}

/**
 * Payload dữ liệu đầu vào khi bắt đầu một phiên học mới.
 *
 * @remarks
 * - `id` tùy chọn, hệ thống tự cấp phát UUID v4 khi ghi nhận.
 */
export type CreateStudySessionInput = Omit<StudySession, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

/**
 * Payload dữ liệu đầu vào khi cập nhật phiên học (ví dụ: hoàn thành phiên học, nộp đáp án).
 *
 * @remarks
 * - **CONTRACT**: Yêu cầu bắt buộc phải có `id` phiên học. `createdAt` không thể thay đổi.
 */
export type UpdateStudySessionInput = Partial<Omit<StudySession, 'id' | 'createdAt'>> & {
  id: string;
};

