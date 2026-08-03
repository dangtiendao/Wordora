'use client';

import * as React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LearningItem } from '@/domain/entities/learning-item';
import { Edit, Copy, Trash2, Volume2, Tag, HelpCircle } from 'lucide-react';

export interface LearningItemCardProps {
  item: LearningItem;
  isSelected?: boolean;
  onSelectToggle?: (item: LearningItem) => void;
  onEdit?: (item: LearningItem) => void;
  onDuplicate?: (item: LearningItem) => void;
  onDelete?: (item: LearningItem) => void;
}

const TYPE_LABELS: Record<string, { label: string; class: string }> = {
  vocabulary: { label: 'Từ vựng', class: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' },
  phrase: { label: 'Cụm từ', class: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60' },
  sentence: { label: 'Mẫu câu', class: 'bg-purple-950/80 text-purple-300 border-purple-800/60' },
};

export const LearningItemCard: React.FC<LearningItemCardProps> = ({
  item,
  isSelected = false,
  onSelectToggle,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const typeConfig = TYPE_LABELS[item.type] || TYPE_LABELS.vocabulary;

  return (
    <Card
      variant="interactive"
      className={`relative flex flex-col justify-between transition-all ${
        isSelected ? 'border-emerald-500 bg-emerald-950/10' : ''
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onSelectToggle && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectToggle(item)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                aria-label={`Chọn mục ${item.prompt}`}
              />
            )}
            <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-md ${typeConfig.class}`}>
              {typeConfig.label}
            </span>
            {item.partOfSpeech && (
              <span className="text-[10px] text-slate-400 italic">({item.partOfSpeech})</span>
            )}
          </div>

          {/* Audio Placeholder Button for Phase 6 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-400 cursor-not-allowed opacity-60"
            title="Phát âm TTS (Sẽ được hỗ trợ ở Phase 6)"
            disabled
          >
            <Volume2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="text-base font-bold text-white tracking-tight">{item.prompt}</h4>
            {item.phonetic && <span className="text-xs text-slate-400 font-mono">{item.phonetic}</span>}
          </div>

          <p className="text-sm font-medium text-emerald-400">{item.answer}</p>
        </div>
      </CardHeader>

      <CardContent className="pt-1 space-y-2">
        {item.example && (
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-0.5">
            <p className="text-slate-300 italic">&ldquo;{item.example}&rdquo;</p>
            {item.exampleTranslation && <p className="text-slate-400">➔ {item.exampleTranslation}</p>}
          </div>
        )}

        {item.note && (
          <p className="text-[11px] text-slate-400 bg-amber-950/20 border border-amber-900/40 p-2 rounded-lg">
            💡 {item.note}
          </p>
        )}

        {item.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <Tag className="w-3 h-3 text-slate-500 shrink-0" />
            {item.tags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2.5 mt-2">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Độ khó: {item.difficulty || 3}/5
          </span>

          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onEdit(item)}
                title="Chỉnh sửa"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            )}

            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onDuplicate(item)}
                title="Nhân bản"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:text-rose-400"
                onClick={() => onDelete(item)}
                title="Xóa mục này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
