import { WordoraDatabase } from './wordora-db';
import { DexieDeckRepository } from '../repositories/dexie-deck-repository';
import { DexieLearningItemRepository } from '../repositories/dexie-learning-item-repository';
import { DexieReviewStateRepository } from '../repositories/dexie-review-state-repository';
import { DexieSettingsRepository } from '../repositories/dexie-settings-repository';
import { getCurrentISOString } from '@/lib/date';

export async function initializeDefaultSettings(db: WordoraDatabase): Promise<void> {
  const settingsRepo = new DexieSettingsRepository(db);
  await settingsRepo.get();
}

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
