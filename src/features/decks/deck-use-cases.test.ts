import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WordoraDatabase } from '@/infrastructure/database/wordora-db';
import { getRepositoryContainer } from '@/infrastructure/database/db-factory';
import { DeckUseCases } from './application/deck-use-cases';

describe('DeckUseCases Integration Tests', () => {
  let db: WordoraDatabase;
  let deckUseCases: DeckUseCases;

  beforeEach(() => {
    db = new WordoraDatabase(`test_deck_uc_${Date.now()}_${Math.random()}`);
    const container = getRepositoryContainer(db);
    deckUseCases = new DeckUseCases(container.deckRepository, container.learningItemRepository);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('creates deck successfully with valid input', async () => {
    const deck = await deckUseCases.createDeck({
      name: '  English Oxford 3000  ',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      description: '  Basic English words  ',
    });

    expect(deck.id).toBeDefined();
    expect(deck.name).toBe('English Oxford 3000');
    expect(deck.description).toBe('Basic English words');
    expect(deck.archivedAt).toBeNull();
  });

  it('throws error when source and target languages are identical', async () => {
    await expect(
      deckUseCases.createDeck({
        name: 'Invalid Languages',
        sourceLanguage: 'en',
        targetLanguage: 'en',
      })
    ).rejects.toThrow('Ngôn ngữ nguồn và ngôn ngữ đích không được trùng nhau.');
  });

  it('throws error when name is empty after trim', async () => {
    await expect(
      deckUseCases.createDeck({
        name: '   ',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
      })
    ).rejects.toThrow('Tên bộ học không được để trống.');
  });

  it('updates deck metadata successfully', async () => {
    const created = await deckUseCases.createDeck({
      name: 'Japanese N5',
      sourceLanguage: 'ja',
      targetLanguage: 'vi',
    });

    const updated = await deckUseCases.updateDeck({
      id: created.id,
      name: 'Japanese N5 & N4',
      description: 'Updated description',
    });

    expect(updated.name).toBe('Japanese N5 & N4');
    expect(updated.description).toBe('Updated description');
  });

  it('archives and restores deck', async () => {
    const deck = await deckUseCases.createDeck({
      name: 'Korean TOPIK',
      sourceLanguage: 'ko',
      targetLanguage: 'vi',
    });

    expect(deck.archivedAt).toBeNull();

    const archived = await deckUseCases.archiveDeck(deck.id);
    expect(archived.archivedAt).not.toBeNull();

    const restored = await deckUseCases.restoreDeck(deck.id);
    expect(restored.archivedAt).toBeNull();
  });

  it('filters and sorts decks correctly', async () => {
    const d1 = await deckUseCases.createDeck({
      name: 'Alpha Deck',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });

    const d2 = await deckUseCases.createDeck({
      name: 'Beta Deck',
      sourceLanguage: 'fr',
      targetLanguage: 'vi',
    });

    await deckUseCases.archiveDeck(d2.id);

    // Filter active
    const activeDecks = await deckUseCases.listDecks({ statusFilter: 'active' });
    expect(activeDecks.length).toBe(1);
    expect(activeDecks[0].id).toBe(d1.id);

    // Filter archived
    const archivedDecks = await deckUseCases.listDecks({ statusFilter: 'archived' });
    expect(archivedDecks.length).toBe(1);
    expect(archivedDecks[0].id).toBe(d2.id);

    // Search query
    const searchResult = await deckUseCases.listDecks({ statusFilter: 'all', searchQuery: 'alpha' });
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].name).toBe('Alpha Deck');

    // Sort by name asc
    const sortedByName = await deckUseCases.listDecks({ statusFilter: 'all', sortBy: 'name', sortOrder: 'asc' });
    expect(sortedByName[0].name).toBe('Alpha Deck');
    expect(sortedByName[1].name).toBe('Beta Deck');
  });

  it('deletes deck and returns detail with item count', async () => {
    const deck = await deckUseCases.createDeck({
      name: 'German A1',
      sourceLanguage: 'de',
      targetLanguage: 'vi',
    });

    const detail = await deckUseCases.getDeckDetail(deck.id);
    expect(detail).not.toBeNull();
    expect(detail?.itemCount).toBe(0);

    const deleted = await deckUseCases.deleteDeck(deck.id);
    expect(deleted).toBe(true);

    const afterDelete = await deckUseCases.getDeckDetail(deck.id);
    expect(afterDelete).toBeNull();
  });
});
