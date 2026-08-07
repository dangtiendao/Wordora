import Dexie, { type Table } from 'dexie';
import { Deck } from '@/domain/entities/deck';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { ReviewLog } from '@/domain/entities/review-log';
import { StudySession } from '@/domain/entities/study-session';
import { Recording } from '@/domain/entities/recording';
import { AppSettings } from '@/domain/entities/app-settings';

/**
 * Interface cho bảng appMetadata lưu trữ các cặp key-value cấu hình/trạng thái hệ thống.
 */
export interface AppMetadata {
  key: string;
  value: string | number | boolean | object;
}

/**
 * Lớp Cơ sở dữ liệu chính của ứng dụng Wordora dựa trên Dexie.js (Wrapper cho IndexedDB trình duyệt).
 *
 * @remarks
 * - **DATABASE VERSIONING & INDEXES**:
 *   - Schema Version 1 định nghĩa 8 bảng chính.
 *   - Khoá chính (Primary Key) của các bảng entity luôn dùng chuỗi UUID v4 (không dùng auto-increment) để hỗ trợ xuất/nhập (export/import) và đồng bộ backend không bị trùng lặp ID.
 *   - Bảng `decks`: Indexed `id, name, sourceLanguage, targetLanguage, createdAt, updatedAt, archivedAt` phục vụ tìm kiếm, sắp xếp và lọc soft-delete.
 *   - Bảng `learningItems`: Indexed `id, deckId, type, createdAt, updatedAt` phục vụ truy vấn theo bộ học và phân loại thẻ.
 *   - Bảng `reviewStates`: Indexed `id, itemId, status, dueAt, createdAt, updatedAt` phục vụ quan hệ 1:1 với item và truy vấn thẻ đến hạn ôn tập SRS (`dueAt`).
 *   - Bảng `reviewLogs`: Indexed `id, itemId, sessionId, reviewedAt` phục vụ truy vấn lịch sử học tập.
 *   - Bảng `studySessions`: Indexed `id, deckId, mode, startedAt, completedAt, createdAt` phục vụ theo dõi phiên học.
 *   - Bảng `recordings`: Indexed `id, itemId, createdAt` phục vụ truy vấn file âm thanh ghi âm.
 *   - Bảng `settings`: Indexed `id, updatedAt` lưu cấu hình duy nhất Singleton (`id = 'default'`).
 *   - Bảng `appMetadata`: Indexed `key` lưu các tham số meta hệ thống.
 */
export class WordoraDatabase extends Dexie {
  decks!: Table<Deck, string>;
  learningItems!: Table<LearningItem, string>;
  reviewStates!: Table<ReviewState, string>;
  reviewLogs!: Table<ReviewLog, string>;
  studySessions!: Table<StudySession, string>;
  recordings!: Table<Recording, string>;
  settings!: Table<AppSettings, string>;
  appMetadata!: Table<AppMetadata, string>;

  constructor(databaseName = 'wordora_db') {
    super(databaseName);

    // Schema Version 1
    // Primary keys use string UUIDs (never auto-increment) to support seamless bulk import/export.
    this.version(1).stores({
      decks: 'id, name, sourceLanguage, targetLanguage, createdAt, updatedAt, archivedAt',
      learningItems: 'id, deckId, type, createdAt, updatedAt',
      reviewStates: 'id, itemId, status, dueAt, createdAt, updatedAt',
      reviewLogs: 'id, itemId, sessionId, reviewedAt',
      studySessions: 'id, deckId, mode, startedAt, completedAt, createdAt',
      recordings: 'id, itemId, createdAt',
      settings: 'id, updatedAt',
      appMetadata: 'key',
    });
  }
}

// Global lazy singleton for Client usage
let dbInstance: WordoraDatabase | null = null;

/**
 * Lấy instance Singleton của WordoraDatabase cho Client Component.
 *
 * @remarks
 * - **CLIENT BOUNDARY & SSR GUARD**:
 *   - Trình duyệt hỗ trợ IndexedDB nhưng Node.js SSR / Server Component thì không.
 *   - Hàm thực hiện kiểm tra `typeof window === 'undefined'` và quăng lỗi ngay nếu bị gọi trong môi trường Server Side Rendering để tránh sự cố crash server.
 *
 * @param databaseName - Tên database tùy chọn (mặc định 'wordora_db', cho phép đè tên khi chạy integration test).
 * @returns Instance WordoraDatabase dùng chung duy nhất trên Client.
 * @throws Error nếu gọi từ môi trường SSR/Server.
 */
export function getWordoraDatabase(databaseName?: string): WordoraDatabase {
  if (typeof window === 'undefined') {
    throw new Error('Attempted to initialize IndexedDB on Server Component / SSR environment.');
  }

  if (!dbInstance || (databaseName && dbInstance.name !== databaseName)) {
    dbInstance = new WordoraDatabase(databaseName);
  }
  return dbInstance;
}

/**
 * Đóng kết nối và giải phóng instance WordoraDatabase Singleton hiện tại.
 *
 * @remarks
 * - Phục vụ dọn dẹp dẹp tài nguyên khi chạy unit/integration test để đảm bảo môi trường dữ liệu cách ly giữa các test case.
 */
export function resetDatabaseInstance(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

