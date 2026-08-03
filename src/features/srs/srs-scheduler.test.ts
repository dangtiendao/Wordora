import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReviewState } from '@/domain/entities/review-state';
import { SM2Scheduler } from './engine/sm2-scheduler';
import { ExerciseSrsMapper } from './engine/exercise-srs-mapper';
import { ReviewApplicationService } from './application/review-application-service';
import { SrsQueueBuilder } from './application/srs-queue-builder';
import { getRepositoryContainer, RepositoryContainer } from '@/infrastructure/database/db-factory';
import { WordoraDatabase } from '@/infrastructure/database/wordora-db';

describe('SRS SM-2 Scheduler & Application Service Tests', () => {
  let db: WordoraDatabase;
  let container: RepositoryContainer;
  const fixedNow = new Date('2026-08-01T12:00:00Z');

  const initialNewState: ReviewState = {
    id: 'state-1',
    itemId: 'item-1',
    status: 'new',
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: '2026-08-01T12:00:00Z',
    algorithmVersion: '1.0.0',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };

  beforeEach(() => {
    db = new WordoraDatabase(`test_srs_db_${Date.now()}_${Math.random()}`);
    container = getRepositoryContainer(db);
  });

  afterEach(async () => {
    if (db) {
      await db.delete();
    }
  });

  it('SM2Scheduler.schedule handles initial new state ratings deterministically', () => {
    // again
    const againRes = SM2Scheduler.schedule(initialNewState, 'again', fixedNow);
    expect(againRes.status).toBe('learning');
    expect(againRes.nextState.lapses).toBe(1);
    expect(againRes.nextIntervalDays).toBe(0);
    expect(againRes.algorithmVersion).toBe('1.0.0');

    // hard
    const hardRes = SM2Scheduler.schedule(initialNewState, 'hard', fixedNow);
    expect(hardRes.status).toBe('learning');
    expect(hardRes.nextIntervalDays).toBe(1);

    // good
    const goodRes = SM2Scheduler.schedule(initialNewState, 'good', fixedNow);
    expect(goodRes.status).toBe('review');
    expect(goodRes.nextIntervalDays).toBe(2);

    // easy
    const easyRes = SM2Scheduler.schedule(initialNewState, 'easy', fixedNow);
    expect(easyRes.status).toBe('review');
    expect(easyRes.nextIntervalDays).toBe(5);
  });

  it('clamps Ease Factor within [1.3, 3.5] and Interval within [1, 365]', () => {
    let state = { ...initialNewState, repetitions: 3, intervalDays: 10, easeFactor: 1.35 };

    // Consecutive 'again' ratings should clamp EF at minimum 1.3
    const res1 = SM2Scheduler.schedule(state, 'again', fixedNow);
    expect(res1.nextState.easeFactor).toBeGreaterThanOrEqual(1.3);

    // High interval clamp test
    state = { ...initialNewState, repetitions: 10, intervalDays: 300, easeFactor: 3.5 };
    const res2 = SM2Scheduler.schedule(state, 'easy', fixedNow);
    expect(res2.nextIntervalDays).toBeLessThanOrEqual(365);
  });

  it('evaluates mastered status when repetitions >= 5 and intervalDays >= 30', () => {
    const state: ReviewState = {
      ...initialNewState,
      status: 'review',
      repetitions: 4,
      intervalDays: 20,
      easeFactor: 2.5,
    };

    const res = SM2Scheduler.schedule(state, 'easy', fixedNow);
    expect(res.nextState.repetitions).toBe(5);
    expect(res.nextIntervalDays).toBeGreaterThanOrEqual(30);
    expect(res.status).toBe('mastered');
  });

  it('ExerciseSrsMapper maps correctness and response times correctly', () => {
    expect(ExerciseSrsMapper.mapToRating(false, 1000)).toBe('again');
    expect(ExerciseSrsMapper.mapToRating(true, 1500)).toBe('easy'); // < 3s
    expect(ExerciseSrsMapper.mapToRating(true, 5000)).toBe('good'); // 3s - 8s
    expect(ExerciseSrsMapper.mapToRating(true, 12000)).toBe('hard'); // > 8s
  });

  it('ReviewApplicationService performs atomic Dexie transaction writing state and log', async () => {
    const deck = await container.deckRepository.create({
      name: 'English Deck',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });

    const item = await container.learningItemRepository.create({
      deckId: deck.id,
      type: 'vocabulary',
      prompt: 'hello',
      answer: 'xin chào',
    });

    const service = new ReviewApplicationService(container);
    const result = await service.processReview({
      itemId: item.id,
      rating: 'good',
      reviewedAt: fixedNow.toISOString(),
    });

    expect(result.nextIntervalDays).toBe(2);
    expect(result.status).toBe('review');

    // Verify ReviewState table
    const dbState = await container.reviewStateRepository.findByItemId(item.id);
    expect(dbState).not.toBeNull();
    expect(dbState?.status).toBe('review');
    expect(dbState?.intervalDays).toBe(2);

    // Verify ReviewLog table
    const logs = await container.reviewLogRepository.list({ itemId: item.id });
    expect(logs.length).toBe(1);
    expect(logs[0].rating).toBe('good');
  });

  it('ReviewApplicationService prevents double submit within 5 seconds idempotency window', async () => {
    const deck = await container.deckRepository.create({
      name: 'French Deck',
      sourceLanguage: 'fr',
      targetLanguage: 'vi',
    });

    const item = await container.learningItemRepository.create({
      deckId: deck.id,
      type: 'vocabulary',
      prompt: 'bonjour',
      answer: 'xin chào',
    });

    const service = new ReviewApplicationService(container);

    // First submit
    await service.processReview({
      itemId: item.id,
      rating: 'good',
      reviewedAt: fixedNow.toISOString(),
    });

    // Immediate second submit (same item & rating within 5s window)
    await service.processReview({
      itemId: item.id,
      rating: 'good',
      reviewedAt: new Date(fixedNow.getTime() + 1000).toISOString(),
    });

    const logs = await container.reviewLogRepository.list({ itemId: item.id });
    expect(logs.length).toBe(1); // Second duplicate submit skipped
  });

  it('SrsQueueBuilder prioritizes overdue/learning and caps daily new items', async () => {
    const deck = await container.deckRepository.create({
      name: 'Spanish Deck',
      sourceLanguage: 'es',
      targetLanguage: 'vi',
    });

    // Create 3 items
    const item1 = await container.learningItemRepository.create({ deckId: deck.id, type: 'vocabulary', prompt: 'one', answer: 'một' });
    await container.learningItemRepository.create({ deckId: deck.id, type: 'vocabulary', prompt: 'two', answer: 'hai' });
    await container.learningItemRepository.create({ deckId: deck.id, type: 'vocabulary', prompt: 'three', answer: 'ba' });

    // Set item1 as overdue
    await container.reviewStateRepository.create({
      id: 'state-overdue',
      itemId: item1.id,
      status: 'review',
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 1,
      lapses: 0,
      dueAt: '2026-07-31T00:00:00Z', // Overdue relative to fixedNow
      algorithmVersion: '1.0.0',
    });

    const queueBuilder = new SrsQueueBuilder(container);
    const queue = await queueBuilder.buildQueue({
      deckId: deck.id,
      dailyNewItemLimit: 1,
      nowDate: fixedNow,
    });

    // Expect overdue item first, plus capped 1 new item = total 2 queue items
    expect(queue.length).toBe(2);
    expect(queue[0].item.id).toBe(item1.id);
    expect(queue[0].queueCategory).toBe('overdue');
  });
});
