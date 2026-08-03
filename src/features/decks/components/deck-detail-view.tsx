'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DeckFormDialog } from './deck-form-dialog';
import { DeckWithStats, DeckUseCases } from '../application/deck-use-cases';
import { LearningItemUseCases, LearningItemList } from '@/features/learning-items';
import { CreateDeckInput } from '@/domain/entities/deck';
import { ArrowLeft, Edit, Archive, ArchiveRestore, Trash2, Layers } from 'lucide-react';
import { formatDate } from '@/lib/date';

export interface DeckDetailViewProps {
  deck: DeckWithStats;
  deckUseCases: DeckUseCases;
  itemUseCases: LearningItemUseCases;
  onRefresh: () => Promise<void>;
}

export const DeckDetailView: React.FC<DeckDetailViewProps> = ({
  deck,
  deckUseCases,
  itemUseCases,
  onRefresh,
}) => {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const isArchived = Boolean(deck.archivedAt);

  const handleUpdate = async (data: CreateDeckInput) => {
    setIsLoading(true);
    try {
      await deckUseCases.updateDeck({
        id: deck.id,
        ...data,
      });
      await onRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    setIsLoading(true);
    try {
      if (isArchived) {
        await deckUseCases.restoreDeck(deck.id);
      } else {
        await deckUseCases.archiveDeck(deck.id);
      }
      await onRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deckUseCases.deleteDeck(deck.id);
      router.push('/decks');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/decks" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Trở về danh sách bộ học
      </Link>

      <PageHeader
        title={deck.name}
        description={deck.description || 'Chưa có mô tả chi tiết.'}
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Edit className="w-3.5 h-3.5 mr-1" /> Sửa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchiveToggle}
              isLoading={isLoading}
            >
              {isArchived ? (
                <>
                  <ArchiveRestore className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Phục hồi
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 mr-1 text-amber-400" /> Lưu trữ
                </>
              )}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setIsDeleteConfirmOpen(true)}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
            </Button>
          </div>
        }
      />

      {/* Metadata Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass">
          <CardHeader className="pb-1">
            <span className="text-xs text-slate-400">Cặp ngôn ngữ</span>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-bold text-emerald-400">
              {deck.sourceLanguage.toUpperCase()} → {deck.targetLanguage.toUpperCase()}
            </span>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-1">
            <span className="text-xs text-slate-400">Số mục học tập</span>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-400" />
            <span className="text-2xl font-bold text-white">{deck.itemCount}</span>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-1">
            <span className="text-xs text-slate-400">Thời gian cập nhật</span>
          </CardHeader>
          <CardContent>
            <span className="text-sm font-semibold text-slate-200">{formatDate(deck.updatedAt)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Real Learning Items List Section */}
      <div className="pt-2">
        <LearningItemList deckId={deck.id} itemUseCases={itemUseCases} />
      </div>

      {/* Edit Deck Form Dialog */}
      <DeckFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={deck}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Xác nhận xóa bộ học"
        description={`Bạn có chắc chắn muốn xóa bộ học "${deck.name}"?`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        variant="danger"
        onConfirm={handleDelete}
        isLoading={isLoading}
      >
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-200 space-y-1">
          <p className="font-semibold text-rose-300">⚠️ Cảnh báo xóa vĩnh viễn:</p>
          <p>
            Hành động này sẽ xóa vĩnh viễn bộ học và toàn bộ <strong>{deck.itemCount} mục từ vựng/cụm từ</strong> cùng nhật ký ôn tập liên quan. Thao tác này không thể hoàn tác!
          </p>
        </div>
      </Dialog>
    </div>
  );
};
