export interface ChatSession {
  id: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  distress_level?: string | null;
  requires_escalation?: boolean | null;
}

export interface SendMessageResponse {
  session: ChatSession;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  model?: string | null;
  tokens_used?: number | null;
  escalation_triggered?: boolean;
  escalation_id?: string | null;
}

