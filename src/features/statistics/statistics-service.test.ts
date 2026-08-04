import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StatisticsService } from './application/statistics-service';
import { getRepositoryContainer, RepositoryContainer } from '@/infrastructure/database/db-factory';
import { WordoraDatabase } from '@/infrastructure/database/wordora-db';

describe('StatisticsService Tests', () => {
  let db: WordoraDatabase;
  let container: RepositoryContainer;
  const fixedNow = new Date('2026-08-01T12:00:00Z');

  beforeEach(() => {
    db = new WordoraDatabase(`test_stats_db_${Date.now()}_${Math.random()}`);
    container = getRepositoryContainer(db);
  });

  afterEach(async () => {
    if (db) {
      await db.delete();
    }
  });

  it('handles empty database gracefully without NaN or Infinity', async () => {
    const service = new StatisticsService(container);
    const overview = await service.getOverviewStats(fixedNow);

    expect(overview.totalActiveItems).toBe(0);
    expect(overview.accuracyPercent).toBe(0);
    expect(overview.currentStreakDays).toBe(0);
    expect(overview.todayStudyDurationSeconds).toBe(0);
    expect(overview.statusDistribution.newCount).toBe(0);
  });

  it('calculates accuracy percentage and status distribution correctly', async () => {
    const deck = await container.deckRepository.create({
      name: 'Test Deck',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });

    const item1 = await container.learningItemRepository.create({
      deckId: deck.id,
      type: 'vocabulary',
      prompt: 'one',
      answer: 'một',
    });

    // Create review state & review logs
    await container.reviewStateRepository.create({
      id: 'state-1',
      itemId: item1.id,
      status: 'review',
      easeFactor: 2.5,
      intervalDays: 2,
      repetitions: 1,
      lapses: 0,
      dueAt: '2026-08-01T10:00:00Z',
      algorithmVersion: '1.0.0',
    });

    await container.reviewLogRepository.create({
      id: 'log-1',
      itemId: item1.id,
      exerciseType: 'multipleChoice',
      rating: 'good',
      isCorrect: true,
      responseTimeMs: 2000,
      reviewedAt: '2026-08-01T11:00:00Z',
      previousIntervalDays: 0,
      nextIntervalDays: 2,
      algorithmVersion: '1.0.0',
    });

    const service = new StatisticsService(container);
    const overview = await service.getOverviewStats(fixedNow);

    expect(overview.totalActiveItems).toBe(1);
    expect(overview.accuracyPercent).toBe(100);
    expect(overview.reviewsTodayCount).toBe(1);
  });

  it('calculates continuous learning streak correctly', async () => {
    const deck = await container.deckRepository.create({
      name: 'Streak Deck',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });

    const item = await container.learningItemRepository.create({
      deckId: deck.id,
      type: 'vocabulary',
      prompt: 'streak',
      answer: 'chuỗi',
    });

    // Activity on 2026-08-01 and 2026-07-31 (2 consecutive days)
    await container.reviewLogRepository.create({
      id: 'log-1',
      itemId: item.id,
      exerciseType: 'multipleChoice',
      rating: 'good',
      isCorrect: true,
      responseTimeMs: 1500,
      reviewedAt: '2026-08-01T08:00:00Z',
      previousIntervalDays: 0,
      nextIntervalDays: 2,
      algorithmVersion: '1.0.0',
    });

    await container.reviewLogRepository.create({
      id: 'log-2',
      itemId: item.id,
      exerciseType: 'multipleChoice',
      rating: 'good',
      isCorrect: true,
      responseTimeMs: 1500,
      reviewedAt: '2026-07-31T15:00:00Z',
      previousIntervalDays: 0,
      nextIntervalDays: 2,
      algorithmVersion: '1.0.0',
    });

    const service = new StatisticsService(container);
    const overview = await service.getOverviewStats(fixedNow);

    expect(overview.currentStreakDays).toBe(2);
  });

  it('excludes archived decks from active stats', async () => {
    const activeDeck = await container.deckRepository.create({
      name: 'Active Deck',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });

    const archivedDeck = await container.deckRepository.create({
      name: 'Archived Deck',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });

    await container.learningItemRepository.create({
      deckId: activeDeck.id,
      type: 'vocabulary',
      prompt: 'active',
      answer: 'hoạt động',
    });

    await container.learningItemRepository.create({
      deckId: archivedDeck.id,
      type: 'vocabulary',
      prompt: 'archived',
      answer: 'lưu trữ',
    });

    // Archive second deck
    await container.deckRepository.update({
      id: archivedDeck.id,
      archivedAt: '2026-08-01T00:00:00Z',
    });

    const service = new StatisticsService(container);
    const overview = await service.getOverviewStats(fixedNow);

    expect(overview.totalActiveItems).toBe(1);
  });
});
