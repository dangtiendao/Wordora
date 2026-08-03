'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DeckWithStats } from '@/features/decks';
import { SessionOrder, SessionFilterMode } from '../application/session-builder';
import { Play, Sparkles } from 'lucide-react';

export interface SessionSetupDialogProps {
  decks: DeckWithStats[];
  initialDeckId?: string;
  onStart: (deckId: string, limit: number, order: SessionOrder, filterMode: SessionFilterMode) => void;
  isLoading?: boolean;
}

const LIMIT_OPTIONS = [
  { value: '5', label: '5 thẻ (Phiên ngắn)' },
  { value: '10', label: '10 thẻ (Tiêu chuẩn)' },
  { value: '20', label: '20 thẻ (Phiên dài)' },
  { value: '0', label: 'Tất cả thẻ trong bộ' },
];

const ORDER_OPTIONS = [
  { value: 'random', label: 'Ngẫu nhiên (Shuffled)' },
  { value: 'sequential', label: 'Theo thứ tự tạo' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả từ vựng & câu' },
  { value: 'new_only', label: 'Ưu tiên từ khó / từ mới' },
];

export const SessionSetupDialog: React.FC<SessionSetupDialogProps> = ({
  decks,
  initialDeckId,
  onStart,
  isLoading = false,
}) => {
  const activeDecks = React.useMemo(() => decks.filter((d) => !d.archivedAt && d.itemCount > 0), [decks]);

  const [selectedDeckId, setSelectedDeckId] = React.useState<string>(
    initialDeckId || activeDecks[0]?.id || ''
  );
  const [cardLimit, setCardLimit] = React.useState<number>(10);
  const [order, setOrder] = React.useState<SessionOrder>('random');
  const [filterMode, setFilterMode] = React.useState<SessionFilterMode>('all');

  React.useEffect(() => {
    let isMounted = true;
    if (!selectedDeckId && activeDecks.length > 0) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setSelectedDeckId(activeDecks[0].id);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [activeDecks, selectedDeckId]);

  const deckOptions = React.useMemo(() => {
    return activeDecks.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.itemCount} mục - ${d.sourceLanguage.toUpperCase()} → ${d.targetLanguage.toUpperCase()})`,
    }));
  }, [activeDecks]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId) return;
    onStart(selectedDeckId, cardLimit, order, filterMode);
  };

  if (activeDecks.length === 0) {
    return (
      <Card variant="glass" className="max-w-xl mx-auto my-8 text-center p-6 space-y-4">
        <Sparkles className="w-10 h-10 text-amber-400 mx-auto opacity-80" />
        <CardTitle className="text-xl">Chưa có bộ học khả dụng</CardTitle>
        <CardDescription>
          Bạn cần tạo ít nhất 1 bộ học và thêm từ vựng/cụm từ trước khi bắt đầu phiên học Flashcard.
        </CardDescription>
        <div className="pt-2">
          <Link href="/decks">
            <Button variant="primary" size="md">
              Đến trang quản lý bộ học
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="max-w-xl mx-auto my-6 border-emerald-900/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <CardTitle className="text-xl">Thiết lập phiên học Flashcard</CardTitle>
            <CardDescription>
              Tùy chỉnh số lượng thẻ, thứ tự và bộ lọc để bắt đầu phiên ôn tập hiệu quả.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleStart} className="space-y-4">
          <Select
            label="Chọn bộ học *"
            options={deckOptions}
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Số lượng thẻ"
              options={LIMIT_OPTIONS}
              value={String(cardLimit)}
              onChange={(e) => setCardLimit(Number(e.target.value))}
            />

            <Select
              label="Thứ tự xuất hiện"
              options={ORDER_OPTIONS}
              value={order}
              onChange={(e) => setOrder(e.target.value as SessionOrder)}
            />
          </div>

          <Select
            label="Chế độ lọc nội dung"
            options={FILTER_OPTIONS}
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as SessionFilterMode)}
          />

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto gap-2"
              isLoading={isLoading}
              disabled={!selectedDeckId}
            >
              <Play className="w-4 h-4 fill-current" /> Bắt đầu học ngay
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
