export interface StatusDistribution {
  newCount: number;
  learningCount: number;
  reviewCount: number;
  masteredCount: number;
  totalActiveItems: number;
}

export interface DailyActivityPoint {
  dateStr: string; // YYYY-MM-DD local
  reviewCount: number;
  correctCount: number;
  studyDurationSeconds: number;
}

export interface DeckStatsSummary {
  deckId: string;
  deckName: string;
  totalItems: number;
  masteredItems: number;
  dueItems: number;
  accuracyPercent: number;
}

export interface OverviewStats {
  totalActiveItems: number;
  dueTodayCount: number;
  overdueCount: number;
  newTodayCount: number;
  reviewsTodayCount: number;
  accuracyPercent: number;
  totalStudyDurationSeconds: number;
  todayStudyDurationSeconds: number;
  completedSessionsCount: number;
  currentStreakDays: number;
  statusDistribution: StatusDistribution;
}

export type StatsTimeRange = '7d' | '30d' | 'all';

export interface StatsFilterOptions {
  timeRange?: StatsTimeRange;
  deckId?: string;
}
