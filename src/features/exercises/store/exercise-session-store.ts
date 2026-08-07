import { create } from 'zustand';
import { Exercise, AnswerEvaluation, ExerciseResult } from '@/domain/entities/exercise';
import { getCurrentISOString } from '@/lib/date';

/** Trạng thái phiên làm bài tập. */
export type ExerciseSessionStatus = 'idle' | 'active' | 'completed';

/**
 * Interface mô tả trạng thái và các action của Zustand Store quản lý phiên bài tập (`ExerciseSessionState`).
 *
 * @remarks
 * - **TRANSIENT EXERCISE SESSION STATE**:
 *   - Quản lý danh sách các câu hỏi bài tập ngẫu nhiên (`exercises`), chỉ số câu hiện tại (`currentIndex`), và danh sách câu trả lời của người dùng (`results`).
 *   - Tự động đo thời gian phản hồi `responseTimeMs` cho từng câu hỏi khi nộp bài qua action `submitAnswer`.
 * - **RESET SEMANTICS**:
 *   - `resetSession()` đưa toàn bộ trạng thái về ban đầu (`idle`).
 */
export interface ExerciseSessionState {
  deckId: string | null;
  deckName: string;
  exercises: Exercise[];
  currentIndex: number;
  results: ExerciseResult[];
  startedAt: string | null;
  status: ExerciseSessionStatus;

  /** Bắt đầu phiên làm bài tập mới. */
  startSession: (deckId: string, deckName: string, exercises: Exercise[]) => void;
  /** Ghi nhận câu trả lời của người dùng cho câu hiện tại. */
  submitAnswer: (evaluation: AnswerEvaluation, responseTimeMs: number) => void;
  /** Chuyển sang câu hỏi tiếp theo hoặc kết thúc phiên. */
  nextExercise: () => void;
  /** Hủy phiên bài tập hiện tại. */
  cancelSession: () => void;
  /** Đặt lại toàn bộ trạng thái phiên về ban đầu. */
  resetSession: () => void;
}

/**
 * Zustand store quản lý trạng thái phiên làm bài tập (`useExerciseSessionStore`).
 */
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

