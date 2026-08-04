'use client';

import * as React from 'react';
import { useDatabase } from '@/hooks/use-database';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Deck } from '@/domain/entities/deck';
import {
  StatisticsService,
  OverviewStats,
  DailyActivityPoint,
  DeckStatsSummary,
  StatsTimeRange,
} from '@/features/statistics';
import { BarChart3, Clock, CheckCircle2, Flame, Award, Layers } from 'lucide-react';

export default function StatisticsPage() {
  const { status, container } = useDatabase();
  const [timeRange, setTimeRange] = React.useState<StatsTimeRange>('7d');
  const [selectedDeckId, setSelectedDeckId] = React.useState<string>('all');

  const [decks, setDecks] = React.useState<Deck[]>([]);
  const [overview, setOverview] = React.useState<OverviewStats | null>(null);
  const [activityPoints, setActivityPoints] = React.useState<DailyActivityPoint[]>([]);
  const [deckSummaries, setDeckSummaries] = React.useState<DeckStatsSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const statsService = React.useMemo(() => {
    if (!container) return null;
    return new StatisticsService(container);
  }, [container]);

  const loadStatsData = React.useCallback(async () => {
    if (!container || !statsService) return;
    setIsLoading(true);
    try {
      const activeDecks = await container.deckRepository.list(false);
      setDecks(activeDecks);

      const overviewStats = await statsService.getOverviewStats();
      setOverview(overviewStats);

      const filterDeckId = selectedDeckId === 'all' ? undefined : selectedDeckId;
      const points = await statsService.getDailyActivityPoints({
        timeRange,
        deckId: filterDeckId,
      });
      setActivityPoints(points);

      const summaries = await statsService.getDeckSummaries();
      setDeckSummaries(summaries);
    } catch {
      // Silent catch
    } finally {
      setIsLoading(false);
    }
  }, [container, statsService, timeRange, selectedDeckId]);

  React.useEffect(() => {
    let isMounted = true;
    if (status === 'ready') {
      Promise.resolve().then(() => {
        if (isMounted) loadStatsData();
      });
    }
    return () => {
      isMounted = false;
    };
  }, [status, loadStatsData]);

  if (status === 'initializing' || isLoading) {
    return <LoadingState label="Đang tổng hợp dữ liệu thống kê học tập..." />;
  }

  if (status === 'error') {
    return <ErrorState message="Không thể tải dữ liệu thống kê từ cơ sở dữ liệu IndexedDB." />;
  }

  const formatSeconds = (sec: number) => {
    const mins = Math.round(sec / 60);
    if (mins < 60) return `${mins} phút`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs} giờ`;
  };

  const maxReviewsInChart = Math.max(1, ...activityPoints.map((p) => p.reviewCount));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thống kê & Tiến độ học tập"
        description="Phân tích chi tiết hiệu quả học tập, độ chính xác, chuỗi ngày liên tục và sự tăng trưởng từ vựng."
      />

      {/* Filter Controls Header */}
      <Card variant="glass" className="p-4 border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Bộ lọc xem thống kê:</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-40">
            <Select
              options={[
                { value: '7d', label: '7 ngày gần đây' },
                { value: '30d', label: '30 ngày gần đây' },
                { value: 'all', label: 'Tất cả thời gian' },
              ]}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as StatsTimeRange)}
            />
          </div>

          <div className="w-52">
            <Select
              options={[
                { value: 'all', label: 'Tất cả bộ học' },
                ...decks.map((d) => ({ value: d.id, label: d.name })),
              ]}
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Tỷ lệ chính xác</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {overview?.accuracyPercent ?? 0}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dựa trên tất cả các lượt trả lời</p>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Tổng thời gian học</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-teal-300">
            {formatSeconds(overview?.totalStudyDurationSeconds ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Đã hoàn thành {overview?.completedSessionsCount ?? 0} phiên học
          </p>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Chuỗi ngày liên tục</span>
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {overview?.currentStreakDays ?? 0} ngày
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Học đều đặn mỗi ngày</p>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-400">Từ vựng thành thạo</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300">
            {overview?.statusDistribution.masteredCount ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Trên tổng số {overview?.totalActiveItems ?? 0} từ active
          </p>
        </Card>
      </div>

      {/* Daily Activity Chart Section */}
      <Card variant="glass" className="p-6 border-slate-800 space-y-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base text-white">Biểu đồ hoạt động ôn tập theo ngày</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Số lượng từ vựng được ôn tập trong mốc thời gian đã chọn.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 pt-2 space-y-3">
          {/* Accessible Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-1.5 pt-6 pb-2 px-2 border-b border-slate-800 overflow-x-auto">
            {activityPoints.map((pt) => {
              const heightPercent = Math.round((pt.reviewCount / maxReviewsInChart) * 100);
              return (
                <div key={pt.dateStr} className="flex-1 flex flex-col items-center gap-1 group min-w-[20px]">
                  <div className="relative w-full flex items-end justify-center h-32">
                    <div
                      className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 transition-all duration-300 group-hover:from-emerald-500 group-hover:to-teal-300"
                      style={{ height: `${Math.max(4, heightPercent)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[36px]">
                    {pt.dateStr.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 text-center">
            💡 Tổng số lượt ôn tập trong khoảng thời gian này:{' '}
            <strong className="text-emerald-400">
              {activityPoints.reduce((acc, p) => acc + p.reviewCount, 0)} lượt
            </strong>
          </p>
        </CardContent>
      </Card>

      {/* Deck Breakdown Table */}
      <Card variant="glass" className="p-6 border-slate-800 space-y-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Bảng tiến độ theo từng Bộ học
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Tổng quan tiến trình học tập và mức độ thành thạo của từng bộ học.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {deckSummaries.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">Chưa có dữ liệu bộ học.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Tên bộ học</th>
                    <th className="p-3 text-center">Tổng từ vựng</th>
                    <th className="p-3 text-center">Đã thành thạo</th>
                    <th className="p-3 text-center">Cần ôn hôm nay</th>
                    <th className="p-3 text-right">Độ chính xác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {deckSummaries.map((summary) => (
                    <tr key={summary.deckId} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-white">{summary.deckName}</td>
                      <td className="p-3 text-center text-slate-300">{summary.totalItems}</td>
                      <td className="p-3 text-center font-semibold text-teal-400">
                        {summary.masteredItems}
                      </td>
                      <td className="p-3 text-center font-semibold text-amber-400">
                        {summary.dueItems}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {summary.accuracyPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
