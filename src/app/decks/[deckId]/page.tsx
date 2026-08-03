'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useDatabase } from '@/hooks/use-database';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { UnsupportedFeature } from '@/components/ui/unsupported-feature';
import { DeckDetailView, DeckUseCases, DeckWithStats } from '@/features/decks';
import NotFound from '@/app/not-found';

export default function DeckDetailPage() {
  const params = useParams();
  const deckId = typeof params?.deckId === 'string' ? params.deckId : '';

  const { status, errorMessage, container } = useDatabase();
  const [deck, setDeck] = React.useState<DeckWithStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const deckUseCases = React.useMemo(() => {
    if (!container) return null;
    return new DeckUseCases(container.deckRepository, container.learningItemRepository);
  }, [container]);

  const loadDeckDetail = React.useCallback(async () => {
    if (!deckUseCases || !deckId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await deckUseCases.getDeckDetail(deckId);
      setDeck(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin bộ học.');
    } finally {
      setIsLoading(false);
    }
  }, [deckUseCases, deckId]);

  React.useEffect(() => {
    let isMounted = true;
    if (status === 'ready') {
      Promise.resolve().then(() => {
        if (isMounted) {
          loadDeckDetail();
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [status, loadDeckDetail]);

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

  if (status === 'initializing' || isLoading) {
    return <LoadingState label="Đang tải thông tin bộ học..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDeckDetail} />;
  }

  if (!deck) {
    return <NotFound />;
  }

  return (
    <DeckDetailView
      deck={deck}
      deckUseCases={deckUseCases!}
      onRefresh={loadDeckDetail}
    />
  );
}
