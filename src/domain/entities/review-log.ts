import { ExerciseType, ReviewRating } from '../value-objects/types';

/**
 * Nhật ký Ôn tập (ReviewLog) - Bản ghi lịch sử bất biến (Append-only Audit Log) cho mỗi lượt trả lời mục học.
 *
 * @remarks
 * - **BUSINESS RULE**:
 *   - **IMMUTABLE**: Bản ghi `ReviewLog` chỉ được thêm mới (append-only), tuyệt đối không sửa đổi sau khi lưu trữ.
 *   - Lưu trữ các thông số đo lường hiệu năng: `isCorrect`, `responseTimeMs`, cùng khoảng cách lặp lại trước và sau khi đánh giá (`previousIntervalDays` -> `nextIntervalDays`).
 *   - `sessionId`: Liên kết đến phiên học (`StudySession`) tương ứng (nếu lượt trả lời thuộc về một phiên làm bài).
 * - **INVARIANT**:
 *   - `id` và `itemId` phải là chuỗi UUID v4.
 *   - `reviewedAt` phải là chuỗi ISO 8601 chuẩn UTC.
 */
export interface ReviewLog {
  id: string;
  itemId: string;
  sessionId?: string | null;
  exerciseType: ExerciseType;
  rating: ReviewRating;
  isCorrect: boolean;
  responseTimeMs: number;
  reviewedAt: string; // ISO 8601 UTC
  previousIntervalDays: number;
  nextIntervalDays: number;
  algorithmVersion: string;
}

/**
 * Payload dữ liệu đầu vào khi ghi lại nhật ký ôn tập (ReviewLog).
 *
 * @remarks
 * - `id` tùy chọn; hệ thống lưu trữ tự động phát sinh UUID v4 khi ghi nhận log mới.
 */
export type CreateReviewLogInput = Omit<ReviewLog, 'id'> & {
  id?: string;
};

