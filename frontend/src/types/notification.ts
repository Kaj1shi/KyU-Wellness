export interface AppNotification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  read: boolean;
  metadata?: {
    escalation_id?: string;
    student_id?: string;
    distress_level?: string;
  } | null;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}
