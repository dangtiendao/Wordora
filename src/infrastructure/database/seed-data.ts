import { WordoraDatabase } from './wordora-db';
import { DexieDeckRepository } from '../repositories/dexie-deck-repository';
import { DexieLearningItemRepository } from '../repositories/dexie-learning-item-repository';
import { DexieReviewStateRepository } from '../repositories/dexie-review-state-repository';
import { DexieSettingsRepository } from '../repositories/dexie-settings-repository';
import { getCurrentISOString } from '@/lib/date';

/**
 * Đảm bảo bản ghi Cấu hình ứng dụng Singleton (`AppSettings`) luôn được khởi tạo khi mở ứng dụng lần đầu.
 *
 * @param db - Instance cơ sở dữ liệu WordoraDatabase.
 */
export async function initializeDefaultSettings(db: WordoraDatabase): Promise<void> {
  const settingsRepo = new DexieSettingsRepository(db);
  await settingsRepo.get();
}

/**
 * Nạp dữ liệu mẫu ban đầu cho môi trường phát triển (Development / Demo Seed).
 *
 * @remarks
 * - **IDEMPOTENT CHECK**:
 *   - Kiểm tra số lượng bộ học hiện tại qua `deckRepo.count(true)`. Nếu cơ sở dữ liệu đã có ít nhất 1 bộ học, hàm ngay lập tức bỏ qua và trả về `{ deckCount: 0, itemCount: 0 }` để tránh tạo trùng lắp dữ liệu.
 * - **SEED DATA**:
 *   - Tạo 1 Bộ học Oxford 3000 mẫu.
 *   - Tạo 2 thẻ học mẫu (1 từ vựng, 1 mẫu câu) kèm `ReviewState` tương ứng ở trạng thái `new` và `learning`.
 *
 * @param db - Instance cơ sở dữ liệu WordoraDatabase.
 * @returns Số lượng deck và item được tạo mới.
 */
export async function seedDevelopmentData(db: WordoraDatabase): Promise<{ deckCount: number; itemCount: number }> {
  const deckRepo = new DexieDeckRepository(db);
  const itemRepo = new DexieLearningItemRepository(db);
  const reviewStateRepo = new DexieReviewStateRepository(db);

  const existingDecks = await deckRepo.count(true);
  if (existingDecks > 0) {
    return { deckCount: 0, itemCount: 0 };
  }

  const deck1 = await deckRepo.create({
    name: 'English Oxford 3000 - Demo',
    description: 'Các từ vựng thông dụng hàng ngày dành cho giao tiếp cơ bản.',
    sourceLanguage: 'en',
    targetLanguage: 'vi',
    color: '#10b981',
    icon: 'book',
  });

  const now = getCurrentISOString();

  const item1 = await itemRepo.create({
    deckId: deck1.id,
    type: 'vocabulary',
    prompt: 'vocabulary',
    answer: 'từ vựng',
    phonetic: '/vəˈkæbjələri/',
    example: 'Building a rich vocabulary is essential for fluent communication.',
    exampleTranslation: 'Xây dựng vốn từ vựng phong phú là rất cần thiết cho giao tiếp trôi chảy.',
    partOfSpeech: 'noun',
    difficulty: 2,
    tags: ['essential', 'beginner'],
  });

  await reviewStateRepo.create({
    itemId: item1.id,
    status: 'new',
    dueAt: now,
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    algorithmVersion: 'sm2-v1',
  });

  const item2 = await itemRepo.create({
    deckId: deck1.id,
    type: 'sentence',
    prompt: 'How are you doing today?',
    answer: 'Hôm nay bạn thế nào?',
    example: 'Hi John, how are you doing today?',
    exampleTranslation: 'Chào John, hôm nay bạn thế nào?',
    difficulty: 1,
    tags: ['greeting', 'daily'],
  });

  await reviewStateRepo.create({
    itemId: item2.id,
    status: 'learning',
    dueAt: now,
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 1,
    lapses: 0,
    algorithmVersion: 'sm2-v1',
  });

  return { deckCount: 1, itemCount: 2 };
}

