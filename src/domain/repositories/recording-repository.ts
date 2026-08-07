import { Recording, CreateRecordingInput } from '../entities/recording';

/**
 * Hợp đồng Repository quản lý lưu trữ và truy xuất các tệp âm thanh ghi âm (Recording).
 *
 * @remarks
 * - **CONTRACT & BLOB STORAGE**:
 *   - Quản lý dữ liệu `Blob` trong IndexedDB qua Dexie.
 *   - `findByItemId(itemId)`: Lấy toàn bộ các bản ghi âm thuộc về một mục học.
 *   - `deleteByItemId(itemId)`: Xóa toàn bộ ghi âm liên quan đến mục học nhằm giải phóng bộ nhớ lưu trữ trình duyệt.
 *   - `bulkUpsert(recordings)`: Nạp hàng loạt dữ liệu ghi âm đảm bảo tính idempotent.
 */
export interface RecordingRepository {
  findById(id: string): Promise<Recording | null>;
  findByItemId(itemId: string): Promise<Recording[]>;
  create(input: CreateRecordingInput): Promise<Recording>;
  delete(id: string): Promise<boolean>;
  deleteByItemId(itemId: string): Promise<number>;
  bulkUpsert(recordings: Recording[]): Promise<void>;
  count(itemId?: string): Promise<number>;
}

