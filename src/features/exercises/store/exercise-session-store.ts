import { create } from 'zustand';
import { Exercise, AnswerEvaluation, ExerciseResult } from '@/domain/entities/exercise';
import { getCurrentISOString } from '@/lib/date';

export type ExerciseSessionStatus = 'idle' | 'active' | 'completed';

export interface ExerciseSessionState {
  deckId: string | null;
  deckName: string;
  exercises: Exercise[];
  currentIndex: number;
  results: ExerciseResult[];
  startedAt: string | null;
  status: ExerciseSessionStatus;

  startSession: (deckId: string, deckName: string, exercises: Exercise[]) => void;
  submitAnswer: (evaluation: AnswerEvaluation, responseTimeMs: number) => void;
  nextExercise: () => void;
  cancelSession: () => void;
  resetSession: () => void;
}

export const useExerciseSessionStore = create<ExerciseSessionState>((set, get) => ({
  deckId: null,
  deckName: '',
  exercises: [],
  currentIndex: 0,
  results: [],
  startedAt: null,
  status: 'idle',

  startSession: (deckId, deckName, exercises) => {
    if (!exercises || exercises.length === 0) return;
    set({
      deckId,
      deckName,
      exercises,
      currentIndex: 0,
      results: [],
      startedAt: getCurrentISOString(),
      status: 'active',
    });
  },

  submitAnswer: (evaluation, responseTimeMs) => {
    const { status, currentIndex, exercises, results } = get();
    if (status !== 'active') return;

    const currentEx = exercises[currentIndex];
    if (!currentEx) return;

    const newResult: ExerciseResult = {
      exerciseId: currentEx.id,
      itemId: currentEx.item.id,
      type: currentEx.type,
      prompt: currentEx.prompt,
      userResponse: String(evaluation.userChoice),
      correctAnswer: evaluation.correctAnswer,
      isCorrect: evaluation.isCorrect,
      responseTimeMs,
    };

    set({
      results: [...results, newResult],
    });
  },

  nextExercise: () => {
    const { status, currentIndex, exercises } = get();
    if (status !== 'active') return;

    if (currentIndex < exercises.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      set({ status: 'completed' });
    }
  },

  cancelSession: () => {
    set({ status: 'idle', exercises: [], results: [] });
  },

  resetSession: () => {
    set({
      deckId: null,
      deckName: '',
      exercises: [],
      currentIndex: 0,
      results: [],
      startedAt: null,
      status: 'idle',
    });
  },
}));
