import { Deck, CreateDeckInput, UpdateDeckInput } from '../entities/deck';

/**
 * Hợp đồng Repository quản lý việc lưu trữ và truy xuất dữ liệu Bộ học (Deck).
 *
 * @remarks
 * - **CONTRACT & BUSINESS RULES**:
 *   - `findById(id)`: Tìm bộ học theo `id`. Trả về `null` nếu không tìm thấy.
 *   - `list(includeArchived?)`: Lấy danh sách bộ học. Mặc định `includeArchived = false` (ẩn các bộ học đã bị lưu trữ).
 *   - `delete(id)`: Xóa cứng bộ học. Implementation tầng lưu trữ BẮT BUỘC phải thực hiện Cascade Delete toàn bộ dữ liệu phụ thuộc (`LearningItem`, `ReviewState`, `ReviewLog`, `Recording`, `StudySession`) trong cùng 1 atomic transaction.
 *   - `bulkUpsert(decks)`: Đảm bảo tính idempotent khi sao lưu / khôi phục dữ liệu: nếu ID đã tồn tại thì ghi đè (update), nếu chưa thì tạo mới (insert).
 */
export interface DeckRepository {
  findById(id: string): Promise<Deck | null>;
  list(includeArchived?: boolean): Promise<Deck[]>;
  create(input: CreateDeckInput): Promise<Deck>;
  update(input: UpdateDeckInput): Promise<Deck>;
  delete(id: string): Promise<boolean>;
  bulkCreate(inputs: CreateDeckInput[]): Promise<Deck[]>;
  bulkUpsert(decks: Deck[]): Promise<void>;
  count(includeArchived?: boolean): Promise<number>;
}

