import { ReviewStatus, ReviewRating } from '../value-objects/types';

/**
 * Trạng thái ôn tập ngắt quãng (ReviewState) của một Mục học theo thuật toán Lặp lại ngắt quãng (SRS/SM-2).
 *
 * @remarks
 * - **BUSINESS RULE & SM-2 ALGORITHM**:
 *   - Quan hệ 1:1 nghiêm ngặt với `LearningItem` thông qua `itemId`.
 *   - `dueAt`: Mốc thời gian ISO 8601 UTC đến hạn ôn tập tiếp theo.
 *   - `intervalDays`: Khoảng cách số ngày giữa hai lượt ôn tập liền kề.
 *   - `easeFactor`: Hệ số độ dễ (Ease Factor - mặc định khởi tạo là 2.5, tối thiểu 1.3 theo thang SM-2).
 *   - `repetitions`: Số lượt trả lời đúng liên tiếp.
 *   - `lapses`: Số lượt bị quên/trả lời sai khiến mục học bị rơi lại giai đoạn `learning`.
 *   - `algorithmVersion`: Phiên bản thuật toán SRS (ví dụ: 'sm2-v1').
 * - **EXTENSION POINT**:
 *   - Trường `algorithmVersion` giúp hệ thống phân biệt và nâng cấp thuật toán SRS (VD: FSRS v4) trong tương lai mà không làm hỏng dữ liệu lịch sử.
 * - **INVARIANT**:
 *   - `id` và `itemId` bắt buộc là chuỗi UUID v4 hợp lệ.
 *   - `dueAt`, `createdAt`, `updatedAt`, `lastReviewedAt` phải là chuỗi ISO 8601 UTC.
 */
export interface ReviewState {
  id: string;
  itemId: string;
  status: ReviewStatus;
  dueAt: string; // ISO 8601 UTC
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  lastRating?: ReviewRating | null;
  lastReviewedAt?: string | null; // ISO 8601 UTC
  algorithmVersion: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}

/**
 * Payload dữ liệu đầu vào khi khởi tạo Trạng thái ôn tập (ReviewState) cho một mục học mới.
 *
 * @remarks
 * - `id` tùy chọn, tự động sinh UUID v4 nếu không truyền.
 * - `algorithmVersion` tùy chọn, mặc định là phiên bản hiện tại của hệ thống nếu không chỉ định.
 */
export type CreateReviewStateInput = Omit<ReviewState, 'id' | 'createdAt' | 'updatedAt' | 'algorithmVersion'> & {
  id?: string;
  algorithmVersion?: string;
};

/**
 * Payload dữ liệu đầu vào khi cập nhật Trạng thái ôn tập (ReviewState) sau một lượt trả lời.
 *
 * @remarks
 * - **CONTRACT**: Yêu cầu bắt buộc cung cấp `id` của `ReviewState`. `createdAt` giữ nguyên.
 */
export type UpdateReviewStateInput = Partial<Omit<ReviewState, 'id' | 'createdAt'>> & {
  id: string;
};

