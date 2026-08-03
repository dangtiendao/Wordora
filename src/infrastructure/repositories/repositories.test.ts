import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WordoraDatabase } from '../database/wordora-db';
import { getRepositoryContainer } from '../database/db-factory';
import { seedDevelopmentData, initializeDefaultSettings } from '../database/seed-data';

describe('Dexie Repositories Integration Tests', () => {
  let db: WordoraDatabase;

  beforeEach(() => {
    // Unique DB name per test to ensure clean state in fake-indexeddb
    db = new WordoraDatabase(`test_db_${Date.now()}_${Math.random()}`);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('performs Deck CRUD operations successfully', async () => {
    const container = getRepositoryContainer(db);
    const { deckRepository } = container;

    // Create
    const created = await deckRepository.create({
      name: 'English Deck',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      description: 'Basic English',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('English Deck');

    // Read / findById
    const found = await deckRepository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('English Deck');

    // Update
    const updated = await deckRepository.update({
      id: created.id,
      name: 'English Advanced Deck',
    });
    expect(updated.name).toBe('English Advanced Deck');

    // List
    const all = await deckRepository.list();
    expect(all.length).toBe(1);

    // Delete
    const deleted = await deckRepository.delete(created.id);
    expect(deleted).toBe(true);

    const count = await deckRepository.count();
    expect(count).toBe(0);
  });

  it('performs LearningItem & ReviewState CRUD and Bulk operations', async () => {
    const container = getRepositoryContainer(db);
    const { deckRepository, learningItemRepository, reviewStateRepository } = container;

    const deck = await deckRepository.create({
      name: 'Vocab Deck',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });

    // Bulk Create Items
    const items = await learningItemRepository.bulkCreate([
      {
        deckId: deck.id,
        type: 'vocabulary',
        prompt: 'hello',
        answer: 'xin chào',
      },
      {
        deckId: deck.id,
        type: 'vocabulary',
        prompt: 'world',
        answer: 'thế giới',
      },
    ]);

    expect(items.length).toBe(2);

    // Count and Filter
    const count = await learningItemRepository.count({ deckId: deck.id });
    expect(count).toBe(2);

    // Create Review State
    const state = await reviewStateRepository.create({
      itemId: items[0].id,
      status: 'new',
      dueAt: new Date().toISOString(),
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
    });

    expect(state.itemId).toBe(items[0].id);

    // Transactional Delete Deck cascade
    await deckRepository.delete(deck.id);

    const remainingItems = await learningItemRepository.count();
    expect(remainingItems).toBe(0);

    const remainingStates = await reviewStateRepository.count();
    expect(remainingStates).toBe(0);
  });

  it('initializes and updates default AppSettings', async () => {
    const container = getRepositoryContainer(db);
    const { settingsRepository } = container;

    await initializeDefaultSettings(db);
    const settings = await settingsRepository.get();

    expect(settings.speechLanguage).toBe('en-US');
    expect(settings.dailyNewItemLimit).toBe(10);

    const updated = await settingsRepository.update({
      dailyNewItemLimit: 25,
      autoPlaySpeech: true,
    });

    expect(updated.dailyNewItemLimit).toBe(25);
    expect(updated.autoPlaySpeech).toBe(true);
  });

  it('runs development seed data correctly', async () => {
    const { deckCount, itemCount } = await seedDevelopmentData(db);
    expect(deckCount).toBe(1);
    expect(itemCount).toBe(2);
  });
});
