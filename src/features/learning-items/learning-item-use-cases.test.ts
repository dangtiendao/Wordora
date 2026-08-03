import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WordoraDatabase } from '@/infrastructure/database/wordora-db';
import { getRepositoryContainer } from '@/infrastructure/database/db-factory';
import { DeckUseCases } from '@/features/decks/application/deck-use-cases';
import { LearningItemUseCases } from './application/learning-item-use-cases';

describe('LearningItemUseCases Integration Tests', () => {
  let db: WordoraDatabase;
  let deckUseCases: DeckUseCases;
  let itemUseCases: LearningItemUseCases;

  beforeEach(() => {
    db = new WordoraDatabase(`test_item_uc_${Date.now()}_${Math.random()}`);
    const container = getRepositoryContainer(db);
    deckUseCases = new DeckUseCases(container.deckRepository, container.learningItemRepository);
    itemUseCases = new LearningItemUseCases(
      container.learningItemRepository,
      container.deckRepository,
      container.reviewStateRepository,
      db
    );
  });

  afterEach(async () => {
    await db.delete();
  });

  it('creates LearningItem and automatically creates initial ReviewState (status: new)', async () => {
    const deck = await deckUseCases.createDeck({
      name: 'English Oxford',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });

    const item = await itemUseCases.createLearningItem({
      deckId: deck.id,
      type: 'vocabulary',
      prompt: '   apple   ',
      answer: '   quả táo   ',
      tags: ['fruit', 'fruit', '  food  ', ''],
    });

    expect(item.id).toBeDefined();
    expect(item.prompt).toBe('apple');
    expect(item.answer).toBe('quả táo');
    expect(item.tags).toEqual(['fruit', 'food']);

    // Check automatic ReviewState creation
    const reviewState = await db.reviewStates.where('itemId').equals(item.id).first();
    expect(reviewState).not.toBeNull();
    expect(reviewState?.status).toBe('new');
    expect(reviewState?.repetitions).toBe(0);
  });

  it('rejects creating item for non-existent deckId', async () => {
    await expect(
      itemUseCases.createLearningItem({
        deckId: '00000000-0000-0000-0000-000000000000',
        type: 'vocabulary',
        prompt: 'test',
        answer: 'kiểm tra',
      })
    ).rejects.toThrow('Bộ học không tồn tại hoặc đã bị xóa.');
  });

  it('preserves Japanese & Vietnamese Unicode diacritics', async () => {
    const deck = await deckUseCases.createDeck({
      name: 'Japanese JLPT N4',
      sourceLanguage: 'ja',
      targetLanguage: 'vi',
    });

    const item = await itemUseCases.createLearningItem({
      deckId: deck.id,
      type: 'phrase',
      prompt: 'こんにちは',
      answer: 'Xin chào trân trọng!',
      phonetic: 'Konnichiwa',
      example: '皆さん、こんにちは！',
      exampleTranslation: 'Chào mọi người!',
    });

    expect(item.prompt).toBe('こんにちは');
    expect(item.answer).toBe('Xin chào trân trọng!');
  });

  it('duplicates item under new ID and fresh ReviewState without copying ReviewLog', async () => {
    const deck = await deckUseCases.createDeck({
      name: 'Korean TOPIK',
      sourceLanguage: 'ko',
      targetLanguage: 'vi',
    });

    const original = await itemUseCases.createLearningItem({
      deckId: deck.id,
      type: 'sentence',
      prompt: '안녕하세요',
      answer: 'Xin chào',
    });

    const duplicate = await itemUseCases.duplicateLearningItem(original.id);

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.prompt).toBe('안녕하세요 (Bản sao)');

    // Verify duplicate gets its own new ReviewState
    const dupState = await db.reviewStates.where('itemId').equals(duplicate.id).first();
    expect(dupState).not.toBeNull();
    expect(dupState?.status).toBe('new');

    // Verify no review logs were cloned
    const dupLogs = await db.reviewLogs.where('itemId').equals(duplicate.id).toArray();
    expect(dupLogs.length).toBe(0);
  });

  it('cascade deletes LearningItem, ReviewState, and ReviewLog', async () => {
    const deck = await deckUseCases.createDeck({
      name: 'Spanish A1',
      sourceLanguage: 'es',
      targetLanguage: 'vi',
    });

    const item = await itemUseCases.createLearningItem({
      deckId: deck.id,
      type: 'vocabulary',
      prompt: 'hola',
      answer: 'xin chào',
    });

    const deleted = await itemUseCases.deleteLearningItem(item.id);
    expect(deleted).toBe(true);

    const remainingState = await db.reviewStates.where('itemId').equals(item.id).first();
    expect(remainingState).toBeUndefined();
  });

  it('filters and sorts learning items correctly', async () => {
    const deck = await deckUseCases.createDeck({
      name: 'French A1',
      sourceLanguage: 'fr',
      targetLanguage: 'vi',
    });

    await itemUseCases.createLearningItem({
      deckId: deck.id,
      type: 'vocabulary',
      prompt: 'bonjour',
      answer: 'xin chào',
      difficulty: 1,
      tags: ['greeting'],
    });

    await itemUseCases.createLearningItem({
      deckId: deck.id,
      type: 'sentence',
      prompt: 'Comment allez-vous?',
      answer: 'Bạn khỏe không?',
      difficulty: 3,
      tags: ['daily'],
    });

    // Filter by type
    const vocabOnly = await itemUseCases.listLearningItems({ deckId: deck.id, type: 'vocabulary' });
    expect(vocabOnly.length).toBe(1);
    expect(vocabOnly[0].prompt).toBe('bonjour');

    // Search query
    const searchResult = await itemUseCases.listLearningItems({ deckId: deck.id, searchQuery: 'allez' });
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].prompt).toBe('Comment allez-vous?');
  });
});
