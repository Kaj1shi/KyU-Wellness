import type { AssessmentResult, AssessmentType, TrendPoint } from './assessment';

export interface DashboardStats {
  assessments_completed: number;
  mood_entries_count: number;
  checkins_count: number;
  chat_sessions_count: number;
}

export interface MoodTrendPoint {
  date: string;
  mood_score: number | null;
  mood_label: string | null;
}

export interface DailyCheckin {
  id: string;
  energy_level: number;
  stress_level: number;
  sleep_quality: number | null;
  notes: string | null;
  created_at: string;
}

export interface DashboardData {
  stats: DashboardStats;
  latest_assessments: Record<AssessmentType, AssessmentResult | null>;
  assessment_trends: Record<AssessmentType, TrendPoint[]>;
  mood_trend: MoodTrendPoint[];
  latest_mood: MoodTrendPoint | null;
  mood_logged_today: boolean;
  checkin_logged_today: boolean;
  latest_checkin: DailyCheckin | null;
  wellness_tip: string;
  is_guest: boolean;
}

export interface MoodEntry {
  id: string;
  mood_score: number;
  mood_label: string | null;
  notes: string | null;
  created_at: string;
}

export const MOOD_OPTIONS = [
  { score: 1, label: 'Very low', emoji: '😔' },
  { score: 2, label: 'Low', emoji: '😕' },
  { score: 3, label: 'Okay', emoji: '😐' },
  { score: 4, label: 'Good', emoji: '🙂' },
  { score: 5, label: 'Great', emoji: '😊' },
] as const;
