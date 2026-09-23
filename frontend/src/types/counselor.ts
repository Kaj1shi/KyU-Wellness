export interface CounselorStats {
  total_students: number;
  active_students: number;
  guest_sessions: number;
  open_escalations: number;
  acknowledged_escalations: number;
  resolved_escalations: number;
  total_assessments: number;
  high_severity_assessments: number;
  unread_notifications: number;
}

export interface EscalationTrendPoint {
  date: string;
  count: number;
}

export interface SeverityBreakdown {
  low: number;
  moderate: number;
  high: number;
  crisis: number;
}

export interface CounselorDashboardData {
  stats: CounselorStats;
  recent_escalations: Array<Record<string, unknown>>;
  escalation_trend: EscalationTrendPoint[];
  distress_breakdown: SeverityBreakdown;
  assessment_severity: Record<string, number>;
}

export interface StudentCaseloadItem {
  id: string;
  nickname: string | null;
  email: string | null;
  faculty: string | null;
  year_of_study: number | null;
  is_anonymous: boolean;
  escalation_count: number;
  open_escalations: number;
  latest_escalation_at: string | null;
  latest_assessment_severity: string | null;
}

export interface StudentAssessmentSummary {
  assessment_type: string;
  title: string;
  score: number;
  max_score: number;
  severity: string;
  completed_at: string;
}

export interface StudentDetail {
  student: {
    id: string;
    nickname: string | null;
    email: string | null;
    faculty: string | null;
    year_of_study: number | null;
    is_anonymous: boolean;
  };
  assessments: StudentAssessmentSummary[];
  escalations: Array<Record<string, unknown>>;
  mood_entries_count: number;
  checkins_count: number;
  chat_sessions_count: number;
}
