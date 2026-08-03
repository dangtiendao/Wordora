'use client';

import * as React from 'react';
import Link from 'next/link';
import { useDatabase } from '@/hooks/use-database';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { DeckUseCases, DeckWithStats } from '@/features/decks';
import { RefreshCw, Sparkles, Flame, Play, Layers } from 'lucide-react';
import { seedDevelopmentData } from '@/infrastructure/database/seed-data';

export default function DashboardPage() {
  const { status, container } = useDatabase();
  const [recentDecks, setRecentDecks] = React.useState<DeckWithStats[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const deckUseCases = React.useMemo(() => {
    if (!container) return null;
    return new DeckUseCases(container.deckRepository, container.learningItemRepository);
  }, [container]);

  const loadDashboardData = React.useCallback(async () => {
    if (!deckUseCases || !container) return;
    setIsLoading(true);
    try {
      // Auto seed 1 demo deck in dev environment if DB is empty to make first-time experience smooth
      if (process.env.NODE_ENV === 'development') {
        await seedDevelopmentData(container.db);
      }

      const activeDecks = await deckUseCases.listDecks({
        statusFilter: 'active',
        sortBy: 'updatedAt',
      });
      setRecentDecks(activeDecks.slice(0, 4));
    } catch {
      // Silent catch for dashboard preview
    } finally {
      setIsLoading(false);
    }
  }, [deckUseCases, container]);

  React.useEffect(() => {
    let isMounted = true;
    if (status === 'ready') {
      Promise.resolve().then(() => {
        if (isMounted) {
          loadDashboardData();
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [status, loadDashboardData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trang tổng quan"
        description="Chào mừng bạn trở lại với Wordora. Sẵn sàng cho phiên học hôm nay!"
        action={
          <Link href="/study">
            <Button size="lg" className="w-full sm:w-auto">
              <Play className="w-4 h-4 fill-current mr-1" /> Bắt đầu học ngay
            </Button>
          </Link>
        }
      />

      {/* Stats Quick Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Mục cần ôn tập</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">0</div>
            <p className="text-[11px] text-slate-400 mt-1">Sẽ được tính toán ở Phase 4 (SRS)</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Bộ học đang active</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{recentDecks.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Bộ học đang trong tiến trình</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Chuỗi ngày học</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">1 ngày</div>
            <p className="text-[11px] text-slate-400 mt-1">Giữ vững phong độ!</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Decks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Bộ học gần đây
          </h2>
          <Link href="/decks" className="text-xs text-emerald-400 hover:underline">
            Xem tất cả bộ học →
          </Link>
        </div>

        {status === 'initializing' || isLoading ? (
          <LoadingState label="Đang tải danh sách bộ học..." />
        ) : recentDecks.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-6 h-6" />}
            title="Chưa có bộ học nào"
            description="Tạo bộ học từ vựng hoặc cụm từ đầu tiên để bắt đầu hành trình học tập."
            actionLabel="Tạo bộ học mới"
            onAction={() => {
              window.location.href = '/decks';
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentDecks.map((deck) => (
              <Card key={deck.id} variant="interactive">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-md">
                      {deck.sourceLanguage.toUpperCase()} → {deck.targetLanguage.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">{deck.itemCount} mục</span>
                  </div>
                  <CardTitle className="text-base mt-2">{deck.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {deck.description || 'Chưa có mô tả.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3 mt-2">
                    <span>Trạng thái: <strong className="text-emerald-400">Đang hoạt động</strong></span>
                    <Link href={`/decks/${deck.id}`}>
                      <Button size="sm" variant="outline">Xem bộ này</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
