import { ReviewState, CreateReviewStateInput, UpdateReviewStateInput } from '../entities/review-state';
import { ReviewStatus } from '../value-objects/types';

/**
 * Các tiêu chí lọc dữ liệu Trạng thái ôn tập ngắt quãng (ReviewState).
 *
 * @remarks
 * - `dueBefore`: Chuỗi ISO 8601 UTC lọc ra các mục học có mốc thời gian đến hạn `dueAt` nhỏ hơn hoặc bằng thời điểm này.
 */
export interface ReviewStateFilterOptions {
  itemId?: string;
  status?: ReviewStatus;
  dueBefore?: string; // ISO 8601 UTC
}

/**
 * Hợp đồng Repository quản lý lưu trữ và truy xuất Trạng thái ôn tập (ReviewState).
 *
 * @remarks
 * - **CONTRACT & BUSINESS RULES**:
 *   - `findByItemId(itemId)`: Tìm kiếm trạng thái ôn tập duy nhất tương ứng với mục học (quan hệ 1:1). Trả về `null` nếu không tìm thấy.
 *   - `list({ dueBefore })`: Lấy danh sách các thẻ học đã đến hạn ôn tập (phục vụ phiên học `srsReview`).
 *   - `bulkUpsert(states)`: Hỗ trợ nạp/cập nhật dữ liệu hàng loạt đảm bảo idempotency.
 */
export interface ReviewStateRepository {
  findById(id: string): Promise<ReviewState | null>;
  findByItemId(itemId: string): Promise<ReviewState | null>;
  list(filter?: ReviewStateFilterOptions): Promise<ReviewState[]>;
  create(input: CreateReviewStateInput): Promise<ReviewState>;
  update(input: UpdateReviewStateInput): Promise<ReviewState>;
  delete(id: string): Promise<boolean>;
  deleteByItemId(itemId: string): Promise<boolean>;
  bulkCreate(inputs: CreateReviewStateInput[]): Promise<ReviewState[]>;
  bulkUpsert(states: ReviewState[]): Promise<void>;
  count(filter?: ReviewStateFilterOptions): Promise<number>;
}

