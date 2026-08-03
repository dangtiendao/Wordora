export interface Deck {
  id: string;
  name: string;
  description: string;
  sourceLanguage: string;
  targetLanguage: string;
  color: string;
  icon: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  archivedAt?: string | null; // ISO 8601 UTC if archived
}

export type CreateDeckInput = Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'color' | 'icon' | 'description'> & {
  id?: string;
  description?: string;
  color?: string;
  icon?: string;
  archivedAt?: string | null;
};

export type UpdateDeckInput = Partial<Omit<Deck, 'id' | 'createdAt'>> & {
  id: string;
};
