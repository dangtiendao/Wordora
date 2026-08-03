'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeckWithStats } from '../application/deck-use-cases';
import { Layers, Archive, ArchiveRestore, Edit, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/date';

export interface DeckCardProps {
  deck: DeckWithStats;
  onEdit?: (deck: DeckWithStats) => void;
  onArchiveToggle?: (deck: DeckWithStats) => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'Anh',
  vi: 'Việt',
  ja: 'Nhật',
  ko: 'Hàn',
  zh: 'Trung',
  fr: 'Pháp',
  de: 'Đức',
  es: 'Tây Ban Nha',
};

export const DeckCard: React.FC<DeckCardProps> = ({ deck, onEdit, onArchiveToggle }) => {
  const isArchived = Boolean(deck.archivedAt);
  const sourceLang = LANGUAGE_LABELS[deck.sourceLanguage] || deck.sourceLanguage.toUpperCase();
  const targetLang = LANGUAGE_LABELS[deck.targetLanguage] || deck.targetLanguage.toUpperCase();

  return (
    <Card variant="interactive" className="relative group flex flex-col justify-between h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: deck.color || '#10b981' }}
            />
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700/80 rounded-md">
              {sourceLang} → {targetLang}
            </span>
            {isArchived && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded-md">
                Đã lưu trữ
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            {deck.itemCount} mục
          </span>
        </div>

        <CardTitle className="text-lg mt-2 group-hover:text-emerald-400 transition-colors">
          <Link href={`/decks/${deck.id}`} className="hover:underline">
            {deck.name}
          </Link>
        </CardTitle>

        <CardDescription className="line-clamp-2 min-h-[36px]">
          {deck.description || 'Chưa có mô tả cho bộ học này.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 mt-1">
          <span className="text-[11px] text-slate-500">Cập nhật: {formatDate(deck.updatedAt)}</span>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(deck);
                }}
                title="Chỉnh sửa"
                aria-label={`Chỉnh sửa bộ ${deck.name}`}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            )}

            {onArchiveToggle && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  onArchiveToggle(deck);
                }}
                title={isArchived ? 'Phục hồi' : 'Lưu trữ'}
                aria-label={isArchived ? `Phục hồi bộ ${deck.name}` : `Lưu trữ bộ ${deck.name}`}
              >
                {isArchived ? (
                  <ArchiveRestore className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                )}
              </Button>
            )}

            <Link href={`/decks/${deck.id}`}>
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
                Xem chi tiết <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
