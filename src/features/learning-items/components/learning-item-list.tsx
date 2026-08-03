'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { LearningItemCard } from './learning-item-card';
import { LearningItemFormDialog } from './learning-item-form-dialog';
import { LearningItemUseCases } from '../application/learning-item-use-cases';
import { LearningItem, CreateLearningItemInput } from '@/domain/entities/learning-item';
import { LearningItemType } from '@/domain/value-objects/types';
import { Search, Plus, Layers, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LearningItemListProps {
  deckId: string;
  itemUseCases: LearningItemUseCases;
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Mới tạo gần đây' },
  { value: 'prompt', label: 'Tên (A - Z)' },
  { value: 'updatedAt', label: 'Cập nhật gần đây' },
];

export const LearningItemList: React.FC<LearningItemListProps> = ({ deckId, itemUseCases }) => {
  const [items, setItems] = React.useState<LearningItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<LearningItemType | 'all'>('all');
  const [sortBy, setSortBy] = React.useState<'createdAt' | 'updatedAt' | 'prompt'>('createdAt');

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<LearningItem | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<LearningItem | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  const loadItems = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await itemUseCases.listLearningItems({
        deckId,
        type: typeFilter,
        searchQuery,
        sortBy,
      });
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách mục học tập.');
    } finally {
      setIsLoading(false);
    }
  }, [deckId, itemUseCases, typeFilter, searchQuery, sortBy]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadItems();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadItems]);

  const handleCreateOrUpdate = async (input: CreateLearningItemInput) => {
    setIsActionLoading(true);
    try {
      if (editingItem) {
        await itemUseCases.updateLearningItem({
          id: editingItem.id,
          ...input,
        });
      } else {
        await itemUseCases.createLearningItem(input);
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await loadItems();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDuplicate = async (item: LearningItem) => {
    setIsActionLoading(true);
    try {
      await itemUseCases.duplicateLearningItem(item.id);
      await loadItems();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deletingItem) return;
    setIsActionLoading(true);
    try {
      await itemUseCases.deleteLearningItem(deletingItem.id);
      setDeletingItem(null);
      await loadItems();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsActionLoading(true);
    try {
      await itemUseCases.bulkDeleteLearningItems(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleting(false);
      await loadItems();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSelectToggle = (item: LearningItem) => {
    setSelectedIds((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* List Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Danh sách từ vựng & câu ({items.length})
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {selectedIds.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsBulkDeleting(true)}
              className="gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa {selectedIds.length} mục đã chọn
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            className="gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm mục học mới
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Tìm theo nội dung, đáp án hoặc tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Type Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-colors',
                typeFilter === 'all' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )}
              onClick={() => setTypeFilter('all')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-colors',
                typeFilter === 'vocabulary' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )}
              onClick={() => setTypeFilter('vocabulary')}
            >
              Từ vựng
            </button>
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-colors',
                typeFilter === 'phrase' ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )}
              onClick={() => setTypeFilter('phrase')}
            >
              Cụm từ
            </button>
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-colors',
                typeFilter === 'sentence' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )}
              onClick={() => setTypeFilter('sentence')}
            >
              Mẫu câu
            </button>
          </div>

          <div className="w-40">
            <Select
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'updatedAt' | 'prompt')}
              className="h-9 text-xs py-1"
            />
          </div>
        </div>
      </div>

      {/* Select All Option Header */}
      {items.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedIds.length === items.length && items.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Chọn tất cả ({items.length} mục)</span>
          </label>
        </div>
      )}

      {/* Item List Grid */}
      {isLoading ? (
        <LoadingState label="Đang tải danh sách mục học tập..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadItems} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6" />}
          title={searchQuery ? 'Không tìm thấy mục học tập phù hợp' : 'Chưa có từ vựng hoặc mẫu câu nào trong bộ này'}
          description={
            searchQuery
              ? `Không có mục nào khớp với từ khóa "${searchQuery}".`
              : 'Hãy thêm các từ vựng, cụm từ hoặc mẫu câu đầu tiên để bắt đầu học.'
          }
          actionLabel={!searchQuery ? 'Thêm mục đầu tiên' : undefined}
          onAction={
            !searchQuery
              ? () => {
                  setEditingItem(null);
                  setIsFormOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <LearningItemCard
              key={item.id}
              item={item}
              isSelected={selectedIds.includes(item.id)}
              onSelectToggle={handleSelectToggle}
              onEdit={(i) => {
                setEditingItem(i);
                setIsFormOpen(true);
              }}
              onDuplicate={handleDuplicate}
              onDelete={(i) => setDeletingItem(i)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <LearningItemFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleCreateOrUpdate}
        deckId={deckId}
        initialData={editingItem}
        isLoading={isActionLoading}
      />

      {/* Single Delete Confirmation */}
      <Dialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Xác nhận xóa mục học tập"
        description={`Bạn có chắc chắn muốn xóa "${deletingItem?.prompt}"?`}
        confirmText="Xóa mục này"
        cancelText="Hủy"
        variant="danger"
        onConfirm={handleDeleteSingle}
        isLoading={isActionLoading}
      />

      {/* Bulk Delete Confirmation */}
      <Dialog
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        title="Xác nhận xóa hàng loạt"
        description={`Bạn có chắc chắn muốn xóa ${selectedIds.length} mục đã chọn?`}
        confirmText={`Xóa ${selectedIds.length} mục`}
        cancelText="Hủy"
        variant="danger"
        onConfirm={handleBulkDelete}
        isLoading={isActionLoading}
      />
    </div>
  );
};
