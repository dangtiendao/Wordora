import { DeckRepository } from '@/domain/repositories/deck-repository';
import { LearningItemRepository } from '@/domain/repositories/learning-item-repository';
import { Deck, CreateDeckInput, UpdateDeckInput } from '@/domain/entities/deck';
import { getCurrentISOString } from '@/lib/date';

export interface ListDecksOptions {
  searchQuery?: string;
  statusFilter?: 'active' | 'archived' | 'all';
  sortBy?: 'updatedAt' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface DeckWithStats extends Deck {
  itemCount: number;
}

export class DeckUseCases {
  constructor(
    private deckRepo: DeckRepository,
    private itemRepo: LearningItemRepository
  ) {}

  async createDeck(input: CreateDeckInput): Promise<Deck> {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Tên bộ học không được để trống.');
    }

    if (input.sourceLanguage === input.targetLanguage) {
      throw new Error('Ngôn ngữ nguồn và ngôn ngữ đích không được trùng nhau.');
    }

    return await this.deckRepo.create({
      ...input,
      name: trimmedName,
      description: input.description?.trim() || '',
    });
  }

  async updateDeck(input: UpdateDeckInput): Promise<Deck> {
    const existing = await this.deckRepo.findById(input.id);
    if (!existing) {
      throw new Error('Bộ học không tồn tại hoặc đã bị xóa.');
    }

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        throw new Error('Tên bộ học không được để trống.');
      }
      input.name = trimmedName;
    }

    const sourceLang = input.sourceLanguage || existing.sourceLanguage;
    const targetLang = input.targetLanguage || existing.targetLanguage;

    if (sourceLang === targetLang) {
      throw new Error('Ngôn ngữ nguồn và ngôn ngữ đích không được trùng nhau.');
    }

    if (input.description !== undefined) {
      input.description = input.description.trim();
    }

    return await this.deckRepo.update(input);
  }

  async archiveDeck(id: string): Promise<Deck> {
    const existing = await this.deckRepo.findById(id);
    if (!existing) {
      throw new Error('Bộ học không tồn tại.');
    }

    return await this.deckRepo.update({
      id,
      archivedAt: getCurrentISOString(),
    });
  }

  async restoreDeck(id: string): Promise<Deck> {
    const existing = await this.deckRepo.findById(id);
    if (!existing) {
      throw new Error('Bộ học không tồn tại.');
    }

    return await this.deckRepo.update({
      id,
      archivedAt: null,
    });
  }

  async deleteDeck(id: string): Promise<boolean> {
    const existing = await this.deckRepo.findById(id);
    if (!existing) {
      throw new Error('Bộ học không tồn tại.');
    }

    return await this.deckRepo.delete(id);
  }

  async getDeckDetail(id: string): Promise<DeckWithStats | null> {
    const deck = await this.deckRepo.findById(id);
    if (!deck) return null;

    const itemCount = await this.itemRepo.count({ deckId: id });
    return {
      ...deck,
      itemCount,
    };
  }

  async listDecks(options?: ListDecksOptions): Promise<DeckWithStats[]> {
    const includeArchived = options?.statusFilter !== 'active';
    let decks = await this.deckRepo.list(includeArchived);

    // Filter by archived status
    if (options?.statusFilter === 'active') {
      decks = decks.filter((d) => !d.archivedAt);
    } else if (options?.statusFilter === 'archived') {
      decks = decks.filter((d) => Boolean(d.archivedAt));
    }

    // Filter by search query
    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      decks = decks.filter(
        (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
    }

    // Sort decks
    const sortBy = options?.sortBy || 'updatedAt';
    const sortOrder = options?.sortOrder || 'desc';

    decks.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'vi');
      } else if (sortBy === 'createdAt') {
        comparison = a.createdAt.localeCompare(b.createdAt);
      } else {
        comparison = a.updatedAt.localeCompare(b.updatedAt);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Populate item counts
    const decksWithStats: DeckWithStats[] = await Promise.all(
      decks.map(async (deck) => {
        const itemCount = await this.itemRepo.count({ deckId: deck.id });
        return {
          ...deck,
          itemCount,
        };
      })
    );

    return decksWithStats;
  }
}
