'use client';

import * as React from 'react';
import { useDatabase } from '@/hooks/use-database';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { UnsupportedFeature } from '@/components/ui/unsupported-feature';
import { DeckUseCases, DeckWithStats } from '@/features/decks';
import { LearningItemUseCases } from '@/features/learning-items';
import { ReviewApplicationService } from '@/features/srs';
import { ReviewRating } from '@/domain/value-objects/types';
import { ReviewState } from '@/domain/entities/review-state';
import {
  SessionSetupDialog,
  FlashcardView,
  SessionSummaryView,
  StudyUseCases,
  buildStudySessionItems,
  useStudySessionStore,
  SessionOrder,
  SessionFilterMode,
  CardRating,
} from '@/features/study';

const RATING_MAP: Record<CardRating, ReviewRating> = {
  1: 'again',
  2: 'hard',
  3: 'good',
  4: 'easy',
};

export default function StudyPage() {
  const { status, errorMessage, container } = useDatabase();
  const [decks, setDecks] = React.useState<DeckWithStats[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = React.useState(true);
  const [currentReviewState, setCurrentReviewState] = React.useState<ReviewState | undefined>(undefined);

  // Zustand Store State & Actions
  const {
    deckId,
    deckName,
    items,
    currentIndex,
    isAnswerVisible,
    ratings,
    startedAt,
    status: sessionStatus,
    startSession,
    flipCard,
    rateCurrentCard,
    cancelSession,
    resetSession,
  } = useStudySessionStore();

  const deckUseCases = React.useMemo(() => {
    if (!container) return null;
    return new DeckUseCases(container.deckRepository, container.learningItemRepository);
  }, [container]);

  const itemUseCases = React.useMemo(() => {
    if (!container) return null;
    return new LearningItemUseCases(
      container.learningItemRepository,
      container.deckRepository,
      container.reviewStateRepository,
      container.db
    );
  }, [container]);

  const studyUseCases = React.useMemo(() => {
    if (!container) return null;
    return new StudyUseCases(container.studySessionRepository);
  }, [container]);

  const reviewAppService = React.useMemo(() => {
    if (!container) return null;
    return new ReviewApplicationService(container);
  }, [container]);

  // Load active decks
  const loadDecks = React.useCallback(async () => {
    if (!deckUseCases) return;
    setIsLoadingDecks(true);
    try {
      const data = await deckUseCases.listDecks({ statusFilter: 'active', sortBy: 'updatedAt' });
      setDecks(data);
    } catch {
      // Silent catch
    } finally {
      setIsLoadingDecks(false);
    }
  }, [deckUseCases]);

  React.useEffect(() => {
    let isMounted = true;
    if (status === 'ready') {
      Promise.resolve().then(() => {
        if (isMounted) {
          loadDecks();
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [status, loadDecks]);

  // Fetch ReviewState for current active card
  const currentItem = items[currentIndex];
  React.useEffect(() => {
    let isMounted = true;
    if (container && currentItem) {
      container.reviewStateRepository.findByItemId(currentItem.id).then((state) => {
        if (isMounted && state) {
          setCurrentReviewState(state);
        } else if (isMounted) {
          setCurrentReviewState(undefined);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [container, currentItem]);

  // Handle rating click with atomic SRS transaction
  const handleRate = async (rating: CardRating) => {
    const activeItem = items[currentIndex];
    rateCurrentCard(rating);

    if (reviewAppService && activeItem) {
      try {
        const srsRating = RATING_MAP[rating];
        await reviewAppService.processReview({
          itemId: activeItem.id,
          rating: srsRating,
        });
      } catch {
        // Silent catch for SRS transaction error
      }
    }
  };

  // Handle start study session
  const handleStartSession = async (
    targetDeckId: string,
    limit: number,
    order: SessionOrder,
    filterMode: SessionFilterMode
  ) => {
    if (!itemUseCases || !deckUseCases) return;
    const targetDeck = decks.find((d) => d.id === targetDeckId);
    if (!targetDeck) return;

    const rawItems = await itemUseCases.listLearningItems({ deckId: targetDeckId });
    const sessionItems = buildStudySessionItems(rawItems, {
      deckId: targetDeckId,
      cardLimit: limit,
      order,
      filterMode,
    });

    if (sessionItems.length === 0) {
      alert('Bộ học này hiện chưa có từ vựng nào phù hợp với bộ lọc.');
      return;
    }

    startSession(targetDeckId, targetDeck.name, sessionItems);
  };

  // Handle completion persistence
  React.useEffect(() => {
    if (sessionStatus === 'completed' && deckId && startedAt && studyUseCases) {
      Promise.resolve().then(async () => {
        try {
          await studyUseCases.completeStudySession({
            deckId,
            totalCards: items.length,
            startedAt,
            ratings,
            mode: 'flashcard',
          });
        } catch {
          // Silent catch for session log persistence
        }
      });
    }
  }, [sessionStatus, deckId, startedAt, items.length, ratings, studyUseCases]);

  if (status === 'unsupported') {
    return (
      <div className="py-12">
        <UnsupportedFeature featureName="Cơ sở dữ liệu IndexedDB" description={errorMessage} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="py-12">
        <ErrorState title="Lỗi cơ sở dữ liệu" message={errorMessage || 'Không thể mở IndexedDB.'} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sessionStatus === 'idle' || sessionStatus === 'cancelled' ? (
        <>
          <PageHeader
            title="Phiên học Flashcard"
            description="Ôn tập từ vựng, cụm từ và mẫu câu bằng thẻ học Flashcard lật mặt thông minh."
          />

          {status === 'initializing' || isLoadingDecks ? (
            <LoadingState label="Đang tải danh sách bộ học..." />
          ) : (
            <SessionSetupDialog decks={decks} onStart={handleStartSession} />
          )}
        </>
      ) : sessionStatus === 'active' && items[currentIndex] ? (
        <FlashcardView
          deckName={deckName}
          item={items[currentIndex]}
          reviewState={currentReviewState}
          currentIndex={currentIndex}
          totalItems={items.length}
          isAnswerVisible={isAnswerVisible}
          onFlip={flipCard}
          onRate={handleRate}
          onCancel={cancelSession}
        />
      ) : sessionStatus === 'completed' ? (
        <SessionSummaryView
          deckName={deckName}
          totalCards={items.length}
          ratings={ratings}
          startedAt={startedAt}
          onRestart={resetSession}
        />
      ) : null}
    </div>
  );
}
