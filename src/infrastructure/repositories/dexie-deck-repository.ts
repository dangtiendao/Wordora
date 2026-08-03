import { DeckRepository } from '@/domain/repositories/deck-repository';
import { Deck, CreateDeckInput, UpdateDeckInput } from '@/domain/entities/deck';
import { WordoraDatabase } from '../database/wordora-db';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

export class DexieDeckRepository implements DeckRepository {
  constructor(private db: WordoraDatabase) {}

  async findById(id: string): Promise<Deck | null> {
    const deck = await this.db.decks.get(id);
    return deck || null;
  }

  async list(includeArchived = false): Promise<Deck[]> {
    if (includeArchived) {
      return await this.db.decks.orderBy('createdAt').reverse().toArray();
    }
    return await this.db.decks
      .filter((deck) => !deck.archivedAt)
      .reverse()
      .toArray();
  }

  async create(input: CreateDeckInput): Promise<Deck> {
    const now = getCurrentISOString();
    const newDeck: Deck = {
      id: input.id || generateUUID(),
      name: input.name,
      description: input.description || '',
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      color: input.color || '#10b981',
      icon: input.icon || 'book',
      createdAt: now,
      updatedAt: now,
      archivedAt: input.archivedAt || null,
    };
    await this.db.decks.add(newDeck);
    return newDeck;
  }

  async update(input: UpdateDeckInput): Promise<Deck> {
    const existing = await this.db.decks.get(input.id);
    if (!existing) {
      throw new Error(`Deck not found with id: ${input.id}`);
    }

    const updated: Deck = {
      ...existing,
      ...input,
      updatedAt: getCurrentISOString(),
    };

    await this.db.decks.put(updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return await this.db.transaction('rw', [this.db.decks, this.db.learningItems, this.db.reviewStates], async () => {
      const existing = await this.db.decks.get(id);
      if (!existing) return false;

      // Delete associated items and review states inside transaction
      const items = await this.db.learningItems.where('deckId').equals(id).toArray();
      const itemIds = items.map((i) => i.id);

      if (itemIds.length > 0) {
        await this.db.reviewStates.where('itemId').anyOf(itemIds).delete();
        await this.db.learningItems.where('deckId').equals(id).delete();
      }

      await this.db.decks.delete(id);
      return true;
    });
  }

  async bulkCreate(inputs: CreateDeckInput[]): Promise<Deck[]> {
    const now = getCurrentISOString();
    const newDecks: Deck[] = inputs.map((input) => ({
      id: input.id || generateUUID(),
      name: input.name,
      description: input.description || '',
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      color: input.color || '#10b981',
      icon: input.icon || 'book',
      createdAt: now,
      updatedAt: now,
      archivedAt: input.archivedAt || null,
    }));

    await this.db.decks.bulkAdd(newDecks);
    return newDecks;
  }

  async bulkUpsert(decks: Deck[]): Promise<void> {
    await this.db.decks.bulkPut(decks);
  }

  async count(includeArchived = false): Promise<number> {
    if (includeArchived) {
      return await this.db.decks.count();
    }
    return await this.db.decks.filter((deck) => !deck.archivedAt).count();
  }
}
