export interface EscalationStudent {
  id: string;
  nickname: string | null;
  email: string | null;
  faculty: string | null;
  year_of_study: number | null;
  is_anonymous: boolean;
}

export interface Escalation {
  id: string;
  user_id: string;
  message_id: string | null;
  level: string;
  status: 'open' | 'acknowledged' | 'resolved';
  distress_snapshot: Record<string, unknown> | null;
  counselor_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  student: EscalationStudent | null;
}
