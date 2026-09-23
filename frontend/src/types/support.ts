export interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackItem {
  id: string;
  user_id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  student_label?: string | null;
}

export interface AppointmentRequest {
  id: string;
  user_id: string;
  preferred_date: string | null;
  reason: string | null;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | string;
  created_at: string;
  student_label?: string | null;
  student_email?: string | null;
}
