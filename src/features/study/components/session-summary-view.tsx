'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardRating } from '../store/study-session-store';
import { Trophy, RefreshCw, Layers, Home, CheckCircle2 } from 'lucide-react';

export interface SessionSummaryViewProps {
  deckName: string;
  totalCards: number;
  ratings: Record<number, CardRating>;
  startedAt: string | null;
  onRestart: () => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  deckName,
  totalCards,
  ratings,
  startedAt,
  onRestart,
}) => {
  const [durationText, setDurationText] = React.useState<string>('0 giây');

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (!isMounted) return;
      if (!startedAt) {
        setDurationText('0 giây');
        return;
      }
      const seconds = Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins === 0) {
        setDurationText(`${secs} giây`);
      } else {
        setDurationText(`${mins} phút ${secs} giây`);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [startedAt]);

  const ratingCounts = React.useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    Object.values(ratings).forEach((r) => {
      if (r >= 1 && r <= 4) counts[r]++;
    });
    return counts;
  }, [ratings]);

  const successPercent = Math.round(
    (((ratingCounts[3] + ratingCounts[4]) / Math.max(1, totalCards)) * 100)
  );

  return (
    <Card variant="glass" className="max-w-xl mx-auto my-6 border-emerald-900/40 text-center p-2">
      <CardHeader className="space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/40 animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <CardTitle className="text-2xl font-extrabold text-white">
            Hoàn thành phiên học!
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            Bạn đã ôn tập xong <strong>{totalCards} thẻ Flashcard</strong> thuộc bộ học <strong>{deckName}</strong>.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score & Duration Overview Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Tỷ lệ nhớ tốt</span>
            <div className="text-3xl font-extrabold text-emerald-400">{successPercent}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Thời gian học</span>
            <div className="text-2xl font-bold text-white tracking-tight">{durationText}</div>
          </div>
        </div>

        {/* Rating Breakdown List */}
        <div className="space-y-2 text-left">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Chi tiết đánh giá của bạn:
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/40 flex flex-col items-center">
              <span className="text-rose-400 font-semibold">1. Chưa nhớ</span>
              <span className="text-lg font-bold text-white">{ratingCounts[1]} thẻ</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40 flex flex-col items-center">
              <span className="text-amber-400 font-semibold">2. Khó</span>
              <span className="text-lg font-bold text-white">{ratingCounts[2]} thẻ</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex flex-col items-center">
              <span className="text-emerald-400 font-semibold">3. Nhớ</span>
              <span className="text-lg font-bold text-white">{ratingCounts[3]} thẻ</span>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40 flex flex-col items-center">
              <span className="text-indigo-400 font-semibold">4. Rất dễ</span>
              <span className="text-lg font-bold text-white">{ratingCounts[4]} thẻ</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Bản ghi phiên học <strong>StudySession</strong> đã được lưu thành công vào cơ sở dữ liệu.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={onRestart} className="w-full sm:w-auto gap-2">
            <RefreshCw className="w-4 h-4" /> Học tiếp phiên mới
          </Button>

          <Link href="/decks" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full gap-2">
              <Layers className="w-4 h-4" /> Quản lý bộ học
            </Button>
          </Link>

          <Link href="/" className="w-full sm:w-auto">
            <Button variant="ghost" size="md" className="w-full gap-2">
              <Home className="w-4 h-4" /> Trang chủ
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
