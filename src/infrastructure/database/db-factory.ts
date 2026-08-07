import { getWordoraDatabase, WordoraDatabase } from './wordora-db';
import { DexieDeckRepository } from '../repositories/dexie-deck-repository';
import { DexieLearningItemRepository } from '../repositories/dexie-learning-item-repository';
import { DexieReviewStateRepository } from '../repositories/dexie-review-state-repository';
import { DexieReviewLogRepository } from '../repositories/dexie-review-log-repository';
import { DexieStudySessionRepository } from '../repositories/dexie-study-session-repository';
import { DexieRecordingRepository } from '../repositories/dexie-recording-repository';
import { DexieSettingsRepository } from '../repositories/dexie-settings-repository';

/**
 * Container đóng gói toàn bộ instance của 7 Repositories cùng kết nối Database.
 */
export interface RepositoryContainer {
  deckRepository: DexieDeckRepository;
  learningItemRepository: DexieLearningItemRepository;
  reviewStateRepository: DexieReviewStateRepository;
  reviewLogRepository: DexieReviewLogRepository;
  studySessionRepository: DexieStudySessionRepository;
  recordingRepository: DexieRecordingRepository;
  settingsRepository: DexieSettingsRepository;
  db: WordoraDatabase;
}

let containerInstance: RepositoryContainer | null = null;

/**
 * Khởi tạo hoặc lấy ra RepositoryContainer duy nhất trong môi trường Client (Factory / Dependency Injection Container).
 *
 * @remarks
 * - **CLIENT BOUNDARY & TEST ISOLATION**:
 *   - Nếu không cung cấp `dbOverride`, hàm bắt buộc chạy trên trình duyệt (Client), quăng ngoại lệ nếu gọi từ SSR.
 *   - Cho phép truyền `dbOverride` (ví dụ database khởi tạo từ `fake-indexeddb`) để cách ly dữ liệu giữa các integration test case.
 *
 * @param dbOverride - Instance WordoraDatabase tùy chọn đè phục vụ testing.
 * @returns Container chứa đầy đủ 7 repositories và instance WordoraDatabase.
 */
export function getRepositoryContainer(dbOverride?: WordoraDatabase): RepositoryContainer {
  if (dbOverride) {
    return {
      db: dbOverride,
      deckRepository: new DexieDeckRepository(dbOverride),
      learningItemRepository: new DexieLearningItemRepository(dbOverride),
      reviewStateRepository: new DexieReviewStateRepository(dbOverride),
      reviewLogRepository: new DexieReviewLogRepository(dbOverride),
      studySessionRepository: new DexieStudySessionRepository(dbOverride),
      recordingRepository: new DexieRecordingRepository(dbOverride),
      settingsRepository: new DexieSettingsRepository(dbOverride),
    };
  }

  if (typeof window === 'undefined') {
    throw new Error('getRepositoryContainer() should only be called on Client environment.');
  }

  if (!containerInstance) {
    const db = getWordoraDatabase();
    containerInstance = {
      db,
      deckRepository: new DexieDeckRepository(db),
      learningItemRepository: new DexieLearningItemRepository(db),
      reviewStateRepository: new DexieReviewStateRepository(db),
      reviewLogRepository: new DexieReviewLogRepository(db),
      studySessionRepository: new DexieStudySessionRepository(db),
      recordingRepository: new DexieRecordingRepository(db),
      settingsRepository: new DexieSettingsRepository(db),
    };
  }

  return containerInstance;
}

/**
 * Reset Singleton instance của RepositoryContainer.
 *
 * @remarks
 * - Phục vụ cleanup tài nguyên container khi chạy các bộ test độc lập.
 */
export function resetRepositoryContainer(): void {
  containerInstance = null;
}

