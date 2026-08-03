import { Deck, CreateDeckInput, UpdateDeckInput } from '../entities/deck';

export interface DeckRepository {
  findById(id: string): Promise<Deck | null>;
  list(includeArchived?: boolean): Promise<Deck[]>;
  create(input: CreateDeckInput): Promise<Deck>;
  update(input: UpdateDeckInput): Promise<Deck>;
  delete(id: string): Promise<boolean>;
  bulkCreate(inputs: CreateDeckInput[]): Promise<Deck[]>;
  bulkUpsert(decks: Deck[]): Promise<void>;
  count(includeArchived?: boolean): Promise<number>;
}
