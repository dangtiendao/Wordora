'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusFilter = 'active' | 'archived' | 'all';
export type SortOption = 'updatedAt' | 'name' | 'createdAt';

export interface DeckFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
}

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Cập nhật gần đây' },
  { value: 'name', label: 'Tên (A - Z)' },
  { value: 'createdAt', label: 'Ngày tạo (Mới nhất)' },
];

export const DeckFilterBar: React.FC<DeckFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Tìm theo tên hoặc mô tả..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 text-xs"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            className={cn(
              'px-3 py-1 rounded-lg font-medium transition-colors',
              statusFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            )}
            onClick={() => onStatusFilterChange('active')}
          >
            Đang học
          </button>
          <button
            type="button"
            className={cn(
              'px-3 py-1 rounded-lg font-medium transition-colors',
              statusFilter === 'archived' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            )}
            onClick={() => onStatusFilterChange('archived')}
          >
            Đã lưu trữ
          </button>
          <button
            type="button"
            className={cn(
              'px-3 py-1 rounded-lg font-medium transition-colors',
              statusFilter === 'all' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
            )}
            onClick={() => onStatusFilterChange('all')}
          >
            Tất cả
          </button>
        </div>

        {/* Sort Select */}
        <div className="w-44">
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            className="h-10 text-xs py-1"
          />
        </div>
      </div>
    </div>
  );
};
