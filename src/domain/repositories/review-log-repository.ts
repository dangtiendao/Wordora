import { ReviewLog, CreateReviewLogInput } from '../entities/review-log';

/**
 * Tiêu chí lọc bản ghi nhật ký ôn tập (ReviewLog).
 */
export interface ReviewLogFilterOptions {
  itemId?: string;
  sessionId?: string;
}

/**
 * Hợp đồng Repository quản lý nhật ký ôn tập (ReviewLog).
 *
 * @remarks
 * - **CONTRACT & IMMUTABILITY**:
 *   - Tập hợp bản ghi chỉ hỗ trợ thêm mới (append-only), **KHÔNG CÓ HÀM UPDATE HOẶC DELETE LẺ**.
 *   - `list(filter)`: Truy vấn danh sách nhật ký phục vụ tính toán biểu đồ thống kê xu hướng học tập.
 *   - `bulkUpsert(logs)`: Đảm bảo tính idempotent khi khôi phục lịch sử học tập từ bản backup.
 */
export interface ReviewLogRepository {
  findById(id: string): Promise<ReviewLog | null>;
  list(filter?: ReviewLogFilterOptions): Promise<ReviewLog[]>;
  create(input: CreateReviewLogInput): Promise<ReviewLog>;
  bulkCreate(inputs: CreateReviewLogInput[]): Promise<ReviewLog[]>;
  bulkUpsert(logs: ReviewLog[]): Promise<void>;
  count(filter?: ReviewLogFilterOptions): Promise<number>;
}

