import axios from 'axios';
import type { AuthResponse, MessageResponse, TokenResponse, User } from '../types/auth';
import type { ChatMessage, ChatSession, SendMessageResponse } from '../types/chat';
import type { Escalation } from '../types/escalation';
import type { AppNotification, UnreadCountResponse } from '../types/notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/** Per-tab auth storage so student and counselor can be tested in separate tabs. */
function readStoredToken(key: string): string | null {
  const value = sessionStorage.getItem(key);
  if (value) return value;
  const legacy = localStorage.getItem(key);
  if (legacy) {
    sessionStorage.setItem(key, legacy);
    localStorage.removeItem(key);
    return legacy;
  }
  return null;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = readStoredToken(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = readStoredToken(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const { data } = await axios.post<TokenResponse>(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          storeTokens(data);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          clearTokens();
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  database: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/health');
  return data;
}

export function getStoredAccessToken(): string | null {
  return readStoredToken(ACCESS_TOKEN_KEY);
}

export function storeTokens(tokens: TokenResponse) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function register(payload: {
  email: string;
  password: string;
  age: number;
  gender: string;
  faculty: string;
  year_of_study: number;
  nickname?: string;
  privacy_consent: boolean;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  storeTokens(data.tokens);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  storeTokens(data.tokens);
  return data;
}

export async function guestLogin(nickname?: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/guest', { nickname });
  storeTokens(data.tokens);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    clearTokens();
  }
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token: string, new_password: string): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/reset-password', {
    token,
    new_password,
  });
  return data;
}

export async function verifyEmail(token: string): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/verify-email', { token });
  return data;
}

export async function getFaculties(): Promise<string[]> {
  const { data } = await api.get<string[]>('/auth/faculties');
  return data;
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const { data } = await api.get<ChatSession[]>('/chat/sessions');
  return data;
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  const { data } = await api.post<ChatSession>('/chat/sessions', { title: title || null });
  return data;
}

export async function renameChatSession(sessionId: string, title: string): Promise<ChatSession> {
  const { data } = await api.patch<ChatSession>(`/chat/sessions/${sessionId}`, { title });
  return data;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await api.delete(`/chat/sessions/${sessionId}`);
}

export async function listChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
  return data;
}

export async function sendChatMessage(sessionId: string, content: string): Promise<SendMessageResponse> {
  // Local Ollama models (e.g. Qwythos) can take several minutes per reply.
  const { data } = await api.post<SendMessageResponse>(
    `/chat/sessions/${sessionId}/messages`,
    {
      content,
      use_ai_distress: true,
    },
    { timeout: 300_000 }
  );
  return data;
}

export async function listNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>('/notifications');
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await api.get<UnreadCountResponse>('/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await api.patch<AppNotification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/mark-all-read');
}

export async function listEscalations(status?: string): Promise<Escalation[]> {
  const { data } = await api.get<Escalation[]>('/escalations', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function updateEscalation(
  id: string,
  payload: { status?: 'acknowledged' | 'resolved'; counselor_notes?: string }
): Promise<Escalation> {
  const { data } = await api.patch<Escalation>(`/escalations/${id}`, payload);
  return data;
}
