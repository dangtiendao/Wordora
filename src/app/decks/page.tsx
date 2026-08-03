'use client';

import * as React from 'react';
import { useDatabase } from '@/hooks/use-database';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { UnsupportedFeature } from '@/components/ui/unsupported-feature';
import {
  DeckCard,
  DeckFilterBar,
  DeckFormDialog,
  DeckUseCases,
  DeckWithStats,
  StatusFilter,
  SortOption,
} from '@/features/decks';
import { CreateDeckInput } from '@/domain/entities/deck';
import { Layers, Plus } from 'lucide-react';

export default function DecksPage() {
  const { status, errorMessage, container } = useDatabase();
  const [decks, setDecks] = React.useState<DeckWithStats[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('active');
  const [sortBy, setSortBy] = React.useState<SortOption>('updatedAt');

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingDeck, setEditingDeck] = React.useState<DeckWithStats | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const deckUseCases = React.useMemo(() => {
    if (!container) return null;
    return new DeckUseCases(container.deckRepository, container.learningItemRepository);
  }, [container]);

  const loadDecks = React.useCallback(async () => {
    if (!deckUseCases) return;
    setIsLoadingDecks(true);
    setLoadError(null);
    try {
      const data = await deckUseCases.listDecks({
        searchQuery,
        statusFilter,
        sortBy,
      });
      setDecks(data);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Không thể tải danh sách bộ học.');
    } finally {
      setIsLoadingDecks(false);
    }
  }, [deckUseCases, searchQuery, statusFilter, sortBy]);

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

  const handleCreateOrUpdate = async (input: CreateDeckInput) => {
    if (!deckUseCases) return;
    setIsSaving(true);
    try {
      if (editingDeck) {
        await deckUseCases.updateDeck({
          id: editingDeck.id,
          ...input,
        });
      } else {
        await deckUseCases.createDeck(input);
      }
      setIsFormOpen(false);
      setEditingDeck(null);
      await loadDecks();
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveToggle = async (deck: DeckWithStats) => {
    if (!deckUseCases) return;
    try {
      if (deck.archivedAt) {
        await deckUseCases.restoreDeck(deck.id);
      } else {
        await deckUseCases.archiveDeck(deck.id);
      }
      await loadDecks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái lưu trữ.');
    }
  };

  if (status === 'unsupported') {
    return (
      <div className="py-12">
        <UnsupportedFeature
          featureName="Cơ sở dữ liệu IndexedDB"
          description={errorMessage}
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="py-12">
        <ErrorState
          title="Không thể khởi tạo cơ sở dữ liệu"
          message={errorMessage || 'Đã xảy ra lỗi khi kết nối IndexedDB.'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý bộ học"
        description="Tạo và quản lý các bộ từ vựng, cụm từ và mẫu câu ngoại ngữ của bạn."
        action={
          <Button
            size="md"
            onClick={() => {
              setEditingDeck(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Tạo bộ học mới
          </Button>
        }
      />

      <DeckFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {isLoadingDecks || status === 'initializing' ? (
        <LoadingState label="Đang tải danh sách bộ học..." />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={loadDecks} />
      ) : decks.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6" />}
          title={
            searchQuery
              ? 'Không tìm thấy bộ học nào phù hợp'
              : statusFilter === 'archived'
              ? 'Chưa có bộ học nào được lưu trữ'
              : 'Chưa có bộ học nào'
          }
          description={
            searchQuery
              ? `Không có kết quả nào khớp với từ khóa "${searchQuery}".`
              : 'Hãy bắt đầu bằng cách tạo bộ học từ vựng hoặc mẫu câu đầu tiên của bạn.'
          }
          actionLabel={!searchQuery && statusFilter === 'active' ? 'Tạo bộ học ngay' : undefined}
          onAction={
            !searchQuery && statusFilter === 'active'
              ? () => {
                  setEditingDeck(null);
                  setIsFormOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={(d) => {
                setEditingDeck(d);
                setIsFormOpen(true);
              }}
              onArchiveToggle={handleArchiveToggle}
            />
          ))}
        </div>
      )}

      <DeckFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDeck(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingDeck}
        isLoading={isSaving}
      />
    </div>
  );
}
