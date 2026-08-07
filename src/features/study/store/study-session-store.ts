import { create } from 'zustand';
import { LearningItem } from '@/domain/entities/learning-item';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

/** Trạng thái vòng đời phiên học flashcard. */
export type SessionStatus = 'idle' | 'active' | 'completed' | 'cancelled';

/** Mức đánh giá thẻ học (1: Chưa nhớ, 2: Khó, 3: Nhớ, 4: Rất dễ). */
export type CardRating = 1 | 2 | 3 | 4;

/**
 * Interface mô tả trạng thái và các action của Zustand Store quản lý phiên học Flashcard (`StudySessionState`).
 *
 * @remarks
 * - **TRANSIENT SESSION STATE ONLY**:
 *   - Store chỉ quản lý trạng thái phiên học tạm thời trong bộ nhớ RAM (`items`, `currentIndex`, `isAnswerVisible`, `ratings`, `status`).
 *   - Store KHÔNG tự động lưu vào LocalStorage hay IndexedDB. Việc lưu nhật ký ôn tập lâu dài được đảm bảo bởi `ReviewApplicationService`.
 * - **FLIP BEFORE RATING INVARIANT**:
 *   - Action `rateCurrentCard(rating)` bắt buộc `status === 'active'` và `isAnswerVisible === true`. Người dùng KHÔNG THỂ gửi đánh giá khi chưa lật thẻ.
 */
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

  /** Khởi tạo phiên học mới với danh sách thẻ. */
  startSession: (deckId: string, deckName: string, items: LearningItem[]) => void;
  /** Đảo trạng thái hiển thị mặt sau (đáp án) của thẻ hiện tại. */
  flipCard: () => void;
  /** Đánh giá mức độ ghi nhớ của thẻ hiện tại (chỉ khả thi khi đã lật mặt sau). */
  rateCurrentCard: (rating: CardRating) => void;
  /** Chuyển sang thẻ tiếp theo. */
  nextCard: () => void;
  /** Quay lại thẻ phía trước. */
  previousCard: () => void;
  /** Hủy bỏ phiên học hiện tại. */
  cancelSession: () => void;
  /** Dọn dẹp toàn bộ trạng thái phiên học về ban đầu (`idle`). */
  resetSession: () => void;
}

/**
 * Zustand store quản lý trạng thái phiên học Flashcard (`useStudySessionStore`).
 */
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

