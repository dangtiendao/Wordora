import { RepositoryContainer } from '@/infrastructure/database/db-factory';
import {
  OverviewStats,
  StatusDistribution,
  DailyActivityPoint,
  DeckStatsSummary,
  StatsFilterOptions,
} from '../domain/stats-types';
import { Deck } from '@/domain/entities/deck';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { ReviewLog } from '@/domain/entities/review-log';
import { StudySession } from '@/domain/entities/study-session';

export class StatisticsService {
  constructor(private container: RepositoryContainer) {}

  /**
   * Helper to format Date into YYYY-MM-DD local string.
   */
  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Computes continuous learning streak in days.
   */
  private calculateStreak(activityDates: Set<string>, nowDate: Date = new Date()): number {
    if (activityDates.size === 0) return 0;

    const current = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const todayStr = this.toLocalDateString(current);
    let streak = 0;

    // Check if today has activity. If not, check if yesterday had activity to keep streak alive.
    if (!activityDates.has(todayStr)) {
      current.setDate(current.getDate() - 1);
      const yesterdayStr = this.toLocalDateString(current);
      if (!activityDates.has(yesterdayStr)) {
        return 0;
      }
    }

    // Count consecutive preceding days
    while (true) {
      const dateStr = this.toLocalDateString(current);
      if (activityDates.has(dateStr)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Retrieves overall statistics for Dashboard and Overview cards.
   */
  async getOverviewStats(nowDate: Date = new Date()): Promise<OverviewStats> {
    const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 23, 59, 59, 999);

    const nowIso = nowDate.toISOString();
    const startOfTodayIso = startOfToday.toISOString();
    const endOfTodayIso = endOfToday.toISOString();

    // 1. Get active decks
    const activeDecks = await this.container.deckRepository.list(false);
    const activeDeckIds = new Set(activeDecks.map((d: Deck) => d.id));

    // 2. Get active learning items
    const allItems = await this.container.learningItemRepository.list();
    const activeItems = allItems.filter((item: LearningItem) => activeDeckIds.has(item.deckId));
    const totalActiveItems = activeItems.length;
    const activeItemIds = new Set(activeItems.map((i: LearningItem) => i.id));

    // 3. Get review states
    const allStates = await this.container.reviewStateRepository.list();
    const activeStates = allStates.filter((s: ReviewState) => activeItemIds.has(s.itemId));
    const stateMap = new Map<string, ReviewState>(activeStates.map((s: ReviewState) => [s.itemId, s]));

    let newCount = 0;
    let learningCount = 0;
    let reviewCount = 0;
    let masteredCount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let newTodayCount = 0;

    for (const item of activeItems) {
      const state = stateMap.get(item.id);
      if (item.createdAt >= startOfTodayIso && item.createdAt <= endOfTodayIso) {
        newTodayCount++;
      }

      if (!state || state.status === 'new' || state.repetitions === 0) {
        newCount++;
      } else if (state.status === 'learning') {
        learningCount++;
      } else if (state.status === 'mastered') {
        masteredCount++;
      } else {
        reviewCount++;
      }

      if (state?.dueAt) {
        if (state.dueAt <= nowIso) {
          overdueCount++;
        }
        if (state.dueAt <= endOfTodayIso) {
          dueTodayCount++;
        }
      }
    }

    const statusDistribution: StatusDistribution = {
      newCount,
      learningCount,
      reviewCount,
      masteredCount,
      totalActiveItems,
    };

    // 4. Fetch Review Logs
    const allLogs = await this.container.reviewLogRepository.list();
    const activeLogs = allLogs.filter((log: ReviewLog) => activeItemIds.has(log.itemId));

    let reviewsTodayCount = 0;
    let correctCount = 0;
    const totalLogsCount = activeLogs.length;

    const activityDates = new Set<string>();

    for (const log of activeLogs) {
      const logDate = new Date(log.reviewedAt);
      activityDates.add(this.toLocalDateString(logDate));

      if (log.isCorrect) correctCount++;
      if (log.reviewedAt >= startOfTodayIso && log.reviewedAt <= endOfTodayIso) {
        reviewsTodayCount++;
      }
    }

    const accuracyPercent =
      totalLogsCount > 0 ? Math.round((correctCount / totalLogsCount) * 100) : 0;

    // 5. Fetch Study Sessions
    const allSessions = await this.container.studySessionRepository.list();
    const activeSessions = allSessions.filter((s: StudySession) => activeDeckIds.has(s.deckId));

    let totalStudyDurationSeconds = 0;
    let todayStudyDurationSeconds = 0;

    for (const session of activeSessions) {
      if (session.completedAt) {
        const sessionDate = new Date(session.completedAt);
        activityDates.add(this.toLocalDateString(sessionDate));
      }

      totalStudyDurationSeconds += session.durationSeconds || 0;
      if (session.startedAt >= startOfTodayIso && session.startedAt <= endOfTodayIso) {
        todayStudyDurationSeconds += session.durationSeconds || 0;
      }
    }

    // Add ReviewLog response times to duration
    const logDurationSec = Math.round(
      activeLogs.reduce((acc: number, l: ReviewLog) => acc + (l.responseTimeMs || 0), 0) / 1000
    );
    totalStudyDurationSeconds += logDurationSec;

    const streakDays = this.calculateStreak(activityDates, nowDate);

    return {
      totalActiveItems,
      dueTodayCount,
      overdueCount,
      newTodayCount,
      reviewsTodayCount,
      accuracyPercent,
      totalStudyDurationSeconds,
      todayStudyDurationSeconds,
      completedSessionsCount: activeSessions.length,
      currentStreakDays: streakDays,
      statusDistribution,
    };
  }

  /**
   * Retrieves daily activity breakdown points for chart visualization.
   */
  async getDailyActivityPoints(options?: StatsFilterOptions, nowDate: Date = new Date()): Promise<DailyActivityPoint[]> {
    const days = options?.timeRange === '7d' ? 7 : options?.timeRange === '30d' ? 30 : 90;
    const pointsMap = new Map<string, DailyActivityPoint>();

    // Pre-fill last N days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - i);
      const dateStr = this.toLocalDateString(d);
      pointsMap.set(dateStr, {
        dateStr,
        reviewCount: 0,
        correctCount: 0,
        studyDurationSeconds: 0,
      });
    }

    const logs = await this.container.reviewLogRepository.list();
    const activeDeckItems = options?.deckId
      ? await this.container.learningItemRepository.list({ deckId: options.deckId })
      : null;
    const targetItemIds = activeDeckItems ? new Set(activeDeckItems.map((i) => i.id)) : null;

    for (const log of logs) {
      if (targetItemIds && !targetItemIds.has(log.itemId)) continue;
      const dateStr = this.toLocalDateString(new Date(log.reviewedAt));
      const pt = pointsMap.get(dateStr);
      if (pt) {
        pt.reviewCount++;
        if (log.isCorrect) pt.correctCount++;
        pt.studyDurationSeconds += Math.round((log.responseTimeMs || 0) / 1000);
      }
    }

    const sessions = await this.container.studySessionRepository.list({ deckId: options?.deckId });
    for (const session of sessions) {
      const dateStr = this.toLocalDateString(new Date(session.startedAt));
      const pt = pointsMap.get(dateStr);
      if (pt) {
        pt.studyDurationSeconds += session.durationSeconds || 0;
      }
    }

    return Array.from(pointsMap.values());
  }

  /**
   * Retrieves summary statistics grouped by Deck.
   */
  async getDeckSummaries(): Promise<DeckStatsSummary[]> {
    const decks = await this.container.deckRepository.list(false);
    const summaries: DeckStatsSummary[] = [];

    const nowIso = new Date().toISOString();

    for (const deck of decks) {
      const items = await this.container.learningItemRepository.list({ deckId: deck.id });
      const itemIds = new Set(items.map((i: LearningItem) => i.id));

      const states = await this.container.reviewStateRepository.list();
      const deckStates = states.filter((s: ReviewState) => itemIds.has(s.itemId));

      let masteredItems = 0;
      let dueItems = 0;

      for (const s of deckStates) {
        if (s.status === 'mastered') masteredItems++;
        if (s.dueAt && s.dueAt <= nowIso) dueItems++;
      }

      const logs = await this.container.reviewLogRepository.list();
      const deckLogs = logs.filter((l: ReviewLog) => itemIds.has(l.itemId));
      const correctLogs = deckLogs.filter((l: ReviewLog) => l.isCorrect).length;
      const accuracyPercent =
        deckLogs.length > 0 ? Math.round((correctLogs / deckLogs.length) * 100) : 0;

      summaries.push({
        deckId: deck.id,
        deckName: deck.name,
        totalItems: items.length,
        masteredItems,
        dueItems,
        accuracyPercent,
      });
    }

    return summaries;
  }
}
