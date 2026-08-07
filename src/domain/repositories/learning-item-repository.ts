import { LearningItem, CreateLearningItemInput, UpdateLearningItemInput } from '../entities/learning-item';
import { LearningItemType } from '../value-objects/types';

/**
 * Tiêu chí lọc danh sách Mục học (LearningItem).
 */
export interface LearningItemFilterOptions {
  deckId?: string;
  type?: LearningItemType;
  tags?: string[];
}

/**
 * Hợp đồng Repository quản lý lưu trữ và truy xuất dữ liệu Thẻ / Mục học (LearningItem).
 *
 * @remarks
 * - **CONTRACT & TRANSACTION RULES**:
 *   - `create(input)`: Tạo mới mục học. Implementation BẮT BUỘC khởi tạo đồng thời một bản ghi `ReviewState` mặc định tương ứng trong cùng 1 atomic transaction.
 *   - `delete(id)`: Xóa một mục học. BẮT BUỘC xóa cascade `ReviewState`, `ReviewLog`, và `Recording` liên quan.
 *   - `deleteByDeckId(deckId)`: Xóa toàn bộ các mục học thuộc một Deck và dọn dẹp các dữ liệu liên quan.
 *   - `bulkUpsert(items)`: Đảm bảo tính idempotent khi khôi phục / nhập dữ liệu hàng loạt.
 */
export interface LearningItemRepository {
  findById(id: string): Promise<LearningItem | null>;
  list(filter?: LearningItemFilterOptions): Promise<LearningItem[]>;
  create(input: CreateLearningItemInput): Promise<LearningItem>;
  update(input: UpdateLearningItemInput): Promise<LearningItem>;
  delete(id: string): Promise<boolean>;
  deleteByDeckId(deckId: string): Promise<number>;
  bulkCreate(inputs: CreateLearningItemInput[]): Promise<LearningItem[]>;
  bulkUpsert(items: LearningItem[]): Promise<void>;
  count(filter?: LearningItemFilterOptions): Promise<number>;
}

