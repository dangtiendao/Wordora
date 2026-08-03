import { LearningItem } from '@/domain/entities/learning-item';

export type SessionOrder = 'sequential' | 'random';
export type SessionFilterMode = 'all' | 'new_only';

export interface SessionBuilderConfig {
  deckId: string;
  cardLimit?: number; // 0 or undefined means all
  order?: SessionOrder;
  filterMode?: SessionFilterMode;
  randomizer?: () => number; // Injectable randomizer for deterministic testing
}

export function buildStudySessionItems(
  items: LearningItem[],
  config: SessionBuilderConfig
): LearningItem[] {
  // Filter items belonging to the target deck
  let filtered = items.filter((item) => item.deckId === config.deckId);

  // Filter mode (for future SRS status filtering, currently filters all or by difficulty/new)
  if (config.filterMode === 'new_only') {
    // Treat difficulty >= 3 or items created within last 7 days as new/priority items
    filtered = filtered.filter((item) => (item.difficulty ?? 3) >= 3);
  }

  // Immutable copy for ordering
  const result = [...filtered];

  if (config.order === 'random') {
    const random = config.randomizer || Math.random;
    // Fisher-Yates shuffle algorithm
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }

  // Apply card limit
  if (config.cardLimit && config.cardLimit > 0 && config.cardLimit < result.length) {
    return result.slice(0, config.cardLimit);
  }

  return result;
}
