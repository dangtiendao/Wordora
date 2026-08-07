import { RecordingRepository } from '@/domain/repositories/recording-repository';
import { Recording, CreateRecordingInput } from '@/domain/entities/recording';
import { WordoraDatabase } from '../database/wordora-db';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

/**
 * Lớp triển khai Repository Bản ghi âm (RecordingRepository) sử dụng IndexedDB/Dexie.
 */
export class DexieRecordingRepository implements RecordingRepository {
  constructor(private db: WordoraDatabase) {}

  /**
   * Tìm bản ghi âm theo ID khoá chính.
   */
  async findById(id: string): Promise<Recording | null> {
    const rec = await this.db.recordings.get(id);
    return rec || null;
  }

  /**
   * Lấy danh sách toàn bộ các bản ghi âm phát âm của một mục học (`itemId`).
   */
  async findByItemId(itemId: string): Promise<Recording[]> {
    return await this.db.recordings.where('itemId').equals(itemId).toArray();
  }

  /**
   * Lưu trữ bản ghi âm mới vào IndexedDB dưới dạng `Blob`.
   */
  async create(input: CreateRecordingInput): Promise<Recording> {
    const newRecording: Recording = {
      id: input.id || generateUUID(),
      itemId: input.itemId,
      audioBlob: input.audioBlob,
      mimeType: input.mimeType,
      durationMs: input.durationMs,
      createdAt: input.createdAt || getCurrentISOString(),
    };

    await this.db.recordings.add(newRecording);
    return newRecording;
  }

  /**
   * Xóa một bản ghi âm theo ID.
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.db.recordings.get(id);
    if (!existing) return false;

    await this.db.recordings.delete(id);
    return true;
  }

  /**
   * Xóa toàn bộ các bản ghi âm thuộc một mục học (`itemId`) để giải phóng dung lượng đĩa.
   */
  async deleteByItemId(itemId: string): Promise<number> {
    return await this.db.recordings.where('itemId').equals(itemId).delete();
  }

  /**
   * Nạp đè dữ liệu danh sách bản ghi âm hàng loạt (`bulkPut`).
   */
  async bulkUpsert(recordings: Recording[]): Promise<void> {
    await this.db.recordings.bulkPut(recordings);
  }

  /**
   * Đếm tổng số bản ghi âm (toàn bộ hoặc lọc theo `itemId`).
   */
  async count(itemId?: string): Promise<number> {
    if (itemId) {
      return await this.db.recordings.where('itemId').equals(itemId).count();
    }
    return await this.db.recordings.count();
  }
}

