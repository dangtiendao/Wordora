import { create } from 'zustand';
import { LearningItem } from '@/domain/entities/learning-item';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

export type SessionStatus = 'idle' | 'active' | 'completed' | 'cancelled';
export type CardRating = 1 | 2 | 3 | 4;

export interface StudySessionState {
  sessionId: string | null;
  deckId: string | null;
  deckName: string;
  items: LearningItem[];
  currentIndex: number;
  isAnswerVisible: boolean;
  ratings: Record<number, CardRating>;
  startedAt: string | null;
  status: SessionStatus;

  startSession: (deckId: string, deckName: string, items: LearningItem[]) => void;
  flipCard: () => void;
  rateCurrentCard: (rating: CardRating) => void;
  nextCard: () => void;
  previousCard: () => void;
  cancelSession: () => void;
  resetSession: () => void;
}

export const useStudySessionStore = create<StudySessionState>((set, get) => ({
  sessionId: null,
  deckId: null,
  deckName: '',
  items: [],
  currentIndex: 0,
  isAnswerVisible: false,
  ratings: {},
  startedAt: null,
  status: 'idle',

  startSession: (deckId, deckName, items) => {
    if (!items || items.length === 0) return;
    set({
      sessionId: generateUUID(),
      deckId,
      deckName,
      items,
      currentIndex: 0,
      isAnswerVisible: false,
      ratings: {},
      startedAt: getCurrentISOString(),
      status: 'active',
    });
  },

  flipCard: () => {
    const { status, isAnswerVisible } = get();
    if (status !== 'active') return;
    set({ isAnswerVisible: !isAnswerVisible });
  },

  rateCurrentCard: (rating) => {
    const { status, isAnswerVisible, currentIndex, items, ratings } = get();
    if (status !== 'active' || !isAnswerVisible) return;

    const newRatings = { ...ratings, [currentIndex]: rating };
    const isLastCard = currentIndex >= items.length - 1;

    if (isLastCard) {
      set({
        ratings: newRatings,
        status: 'completed',
      });
    } else {
      set({
        ratings: newRatings,
        currentIndex: currentIndex + 1,
        isAnswerVisible: false,
      });
    }
  },

  nextCard: () => {
    const { status, currentIndex, items } = get();
    if (status !== 'active') return;
    if (currentIndex < items.length - 1) {
      set({
        currentIndex: currentIndex + 1,
        isAnswerVisible: false,
      });
    } else {
      set({ status: 'completed' });
    }
  },

  previousCard: () => {
    const { status, currentIndex } = get();
    if (status !== 'active') return;
    if (currentIndex > 0) {
      set({
        currentIndex: currentIndex - 1,
        isAnswerVisible: false,
      });
    }
  },

  cancelSession: () => {
    set({ status: 'cancelled' });
  },

  resetSession: () => {
    set({
      sessionId: null,
      deckId: null,
      deckName: '',
      items: [],
      currentIndex: 0,
      isAnswerVisible: false,
      ratings: {},
      startedAt: null,
      status: 'idle',
    });
  },
}));
