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
import { StatisticsService, OverviewStats } from '@/features/statistics';
import { RefreshCw, Sparkles, Flame, Play, Layers, Clock, CheckCircle2, BookOpen } from 'lucide-react';
import { seedDevelopmentData } from '@/infrastructure/database/seed-data';

export default function DashboardPage() {
  const { status, container } = useDatabase();
  const [recentDecks, setRecentDecks] = React.useState<DeckWithStats[]>([]);
  const [stats, setStats] = React.useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const deckUseCases = React.useMemo(() => {
    if (!container) return null;
    return new DeckUseCases(container.deckRepository, container.learningItemRepository);
  }, [container]);

  const statsService = React.useMemo(() => {
    if (!container) return null;
    return new StatisticsService(container);
  }, [container]);

  const loadDashboardData = React.useCallback(async () => {
    if (!deckUseCases || !container || !statsService) return;
    setIsLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        await seedDevelopmentData(container.db);
      }

      const activeDecks = await deckUseCases.listDecks({
        statusFilter: 'active',
        sortBy: 'updatedAt',
      });
      setRecentDecks(activeDecks.slice(0, 4));

      const overviewStats = await statsService.getOverviewStats();
      setStats(overviewStats);
    } catch {
      // Silent catch for dashboard preview
    } finally {
      setIsLoading(false);
    }
  }, [deckUseCases, container, statsService]);

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

  const formatSeconds = (sec: number) => {
    const mins = Math.round(sec / 60);
    if (mins < 60) return `${mins} phút`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs} giờ`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trang tổng quan"
        description="Chào mừng bạn trở lại với Wordora. Theo dõi tiến độ học tập và củng cố từ vựng ngay hôm nay!"
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Link href="/study">
              <Button size="md" variant="primary" className="w-full sm:w-auto gap-1.5">
                <Play className="w-4 h-4 fill-current" /> Ôn Flashcard ({stats?.dueTodayCount || 0} từ)
              </Button>
            </Link>
            <Link href="/review">
              <Button size="md" variant="outline" className="w-full sm:w-auto gap-1.5">
                <BookOpen className="w-4 h-4" /> Làm bài tập
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Quick Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Từ đến hạn hôm nay</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.dueTodayCount ?? 0}</div>
            <p className="text-[11px] text-amber-400 mt-1 font-medium">
              {stats?.overdueCount ? `⚠️ ${stats.overdueCount} từ đã quá hạn` : 'Cần ôn tập hôm nay'}
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Từ mới hôm nay</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.newTodayCount ?? 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Từ mới được thêm hôm nay</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Chuỗi ngày học</span>
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.currentStreakDays ?? 0} ngày</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {(stats?.currentStreakDays ?? 0) > 0 ? '🔥 Giữ vững phong độ!' : 'Hãy hoàn thành 1 bài học hôm nay'}
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-teal-500/10 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Thời gian học hôm nay</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {formatSeconds(stats?.todayStudyDurationSeconds ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tỷ lệ chính xác: <strong className="text-emerald-400">{stats?.accuracyPercent ?? 0}%</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Item Status Distribution Section */}
      {stats && stats.totalActiveItems > 0 && (
        <Card variant="glass" className="border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Phân bố trạng thái học tập ({stats.totalActiveItems} mục từ vựng)
            </span>
            <Link href="/statistics" className="text-emerald-400 hover:underline">
              Chi tiết thống kê →
            </Link>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
            <div
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${(stats.statusDistribution.newCount / stats.totalActiveItems) * 100}%` }}
              title={`Từ mới: ${stats.statusDistribution.newCount}`}
            />
            <div
              className="bg-amber-500 transition-all duration-500"
              style={{ width: `${(stats.statusDistribution.learningCount / stats.totalActiveItems) * 100}%` }}
              title={`Đang học: ${stats.statusDistribution.learningCount}`}
            />
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${(stats.statusDistribution.reviewCount / stats.totalActiveItems) * 100}%` }}
              title={`Đang ôn: ${stats.statusDistribution.reviewCount}`}
            />
            <div
              className="bg-teal-400 transition-all duration-500"
              style={{ width: `${(stats.statusDistribution.masteredCount / stats.totalActiveItems) * 100}%` }}
              title={`Thành thạo: ${stats.statusDistribution.masteredCount}`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Từ mới: {stats.statusDistribution.newCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Đang học: {stats.statusDistribution.learningCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đang ôn: {stats.statusDistribution.reviewCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Thành thạo: {stats.statusDistribution.masteredCount}
            </span>
          </div>
        </Card>
      )}

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
                    <span>
                      Trạng thái: <strong className="text-emerald-400">Đang hoạt động</strong>
                    </span>
                    <Link href={`/decks/${deck.id}`}>
                      <Button size="sm" variant="outline">
                        Xem bộ này
                      </Button>
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
