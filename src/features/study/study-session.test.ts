import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WordoraDatabase } from '@/infrastructure/database/wordora-db';
import { getRepositoryContainer } from '@/infrastructure/database/db-factory';
import { buildStudySessionItems } from './application/session-builder';
import { StudyUseCases } from './application/study-use-cases';
import { useStudySessionStore } from './store/study-session-store';
import { LearningItem } from '@/domain/entities/learning-item';

describe('Study Session Module Tests', () => {
  let db: WordoraDatabase;
  let studyUseCases: StudyUseCases;

  const sampleItems: LearningItem[] = [
    {
      id: 'item-1',
      deckId: 'deck-1',
      type: 'vocabulary',
      prompt: 'apple',
      answer: 'quả táo',
      phonetic: '/ˈæp.əl/',
      example: '',
      exampleTranslation: '',
      note: '',
      partOfSpeech: 'noun',
      difficulty: 1,
      tags: ['fruit'],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'item-2',
      deckId: 'deck-1',
      type: 'phrase',
      prompt: 'how are you',
      answer: 'bạn khỏe không',
      phonetic: '',
      example: '',
      exampleTranslation: '',
      note: '',
      partOfSpeech: '',
      difficulty: 3,
      tags: ['greeting'],
      createdAt: '2026-08-02T00:00:00Z',
      updatedAt: '2026-08-02T00:00:00Z',
    },
    {
      id: 'item-3',
      deckId: 'deck-1',
      type: 'sentence',
      prompt: 'nice to meet you',
      answer: 'rất vui được gặp bạn',
      phonetic: '',
      example: '',
      exampleTranslation: '',
      note: '',
      partOfSpeech: '',
      difficulty: 4,
      tags: ['greeting'],
      createdAt: '2026-08-03T00:00:00Z',
      updatedAt: '2026-08-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    db = new WordoraDatabase(`test_study_${Date.now()}_${Math.random()}`);
    const container = getRepositoryContainer(db);
    studyUseCases = new StudyUseCases(container.studySessionRepository);
    useStudySessionStore.getState().resetSession();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('SessionBuilder respects card limit and random ordering without losing items', () => {
    // Sequential order
    const seq = buildStudySessionItems(sampleItems, {
      deckId: 'deck-1',
      order: 'sequential',
      cardLimit: 2,
    });
    expect(seq.length).toBe(2);
    expect(seq[0].id).toBe('item-1');
    expect(seq[1].id).toBe('item-2');

    // Deterministic random order using mocked randomizer
    const mockRandom = () => 0.5;
    const shuffled = buildStudySessionItems(sampleItems, {
      deckId: 'deck-1',
      order: 'random',
      randomizer: mockRandom,
    });
    expect(shuffled.length).toBe(3);
    const ids = shuffled.map((i) => i.id).sort();
    expect(ids).toEqual(['item-1', 'item-2', 'item-3']);
  });

  it('Zustand store manages card flip and prevents rating when answer is hidden', () => {
    const store = useStudySessionStore.getState();
    store.startSession('deck-1', 'Test Deck', sampleItems);

    let state = useStudySessionStore.getState();
    expect(state.status).toBe('active');
    expect(state.currentIndex).toBe(0);
    expect(state.isAnswerVisible).toBe(false);

    // Attempting to rate card when answer is NOT visible should do nothing
    store.rateCurrentCard(4);
    state = useStudySessionStore.getState();
    expect(state.currentIndex).toBe(0);
    expect(Object.keys(state.ratings).length).toBe(0);

    // Flip card
    store.flipCard();
    state = useStudySessionStore.getState();
    expect(state.isAnswerVisible).toBe(true);

    // Now rate card
    store.rateCurrentCard(3);
    state = useStudySessionStore.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.isAnswerVisible).toBe(false);
    expect(state.ratings[0]).toBe(3);
  });

  it('Zustand store completes session when last card is rated', () => {
    const store = useStudySessionStore.getState();
    store.startSession('deck-1', 'Test Deck', [sampleItems[0]]);

    store.flipCard();
    store.rateCurrentCard(4);

    const state = useStudySessionStore.getState();
    expect(state.status).toBe('completed');
    expect(state.ratings[0]).toBe(4);
  });

  it('StudyUseCases saves completed StudySession record in IndexedDB', async () => {
    const savedSession = await studyUseCases.completeStudySession({
      deckId: 'deck-1',
      totalCards: 3,
      startedAt: '2026-08-03T10:00:00Z',
      ratings: { 0: 3, 1: 4, 2: 1 },
      mode: 'flashcard',
    });

    expect(savedSession.id).toBeDefined();
    expect(savedSession.deckId).toBe('deck-1');
    expect(savedSession.totalQuestions).toBe(3);

    const sessionsInDb = await db.studySessions.toArray();
    expect(sessionsInDb.length).toBe(1);
    expect(sessionsInDb[0].id).toBe(savedSession.id);
  });
});
