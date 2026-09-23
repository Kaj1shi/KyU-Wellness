import { api } from './api';
import type { AppointmentRequest, FeedbackItem, JournalEntry } from '../types/support';

export async function listJournal(): Promise<JournalEntry[]> {
  const { data } = await api.get<JournalEntry[]>('/journal');
  return data;
}

export async function createJournal(payload: {
  title?: string;
  content: string;
}): Promise<JournalEntry> {
  const { data } = await api.post<JournalEntry>('/journal', payload);
  return data;
}

export async function updateJournal(
  id: string,
  payload: { title?: string; content?: string }
): Promise<JournalEntry> {
  const { data } = await api.patch<JournalEntry>(`/journal/${id}`, payload);
  return data;
}

export async function deleteJournal(id: string): Promise<void> {
  await api.delete(`/journal/${id}`);
}

export async function submitFeedback(payload: {
  rating?: number;
  comment?: string;
}): Promise<FeedbackItem> {
  const { data } = await api.post<FeedbackItem>('/feedback', payload);
  return data;
}

export async function listMyFeedback(): Promise<FeedbackItem[]> {
  const { data } = await api.get<FeedbackItem[]>('/feedback/mine');
  return data;
}

export async function listAllFeedback(): Promise<FeedbackItem[]> {
  const { data } = await api.get<FeedbackItem[]>('/feedback');
  return data;
}

export async function createAppointment(payload: {
  preferred_date?: string;
  reason?: string;
}): Promise<AppointmentRequest> {
  const { data } = await api.post<AppointmentRequest>('/appointments', payload);
  return data;
}

export async function listMyAppointments(): Promise<AppointmentRequest[]> {
  const { data } = await api.get<AppointmentRequest[]>('/appointments/mine');
  return data;
}

export async function listAppointments(status?: string): Promise<AppointmentRequest[]> {
  const { data } = await api.get<AppointmentRequest[]>('/appointments', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function updateAppointmentStatus(
  id: string,
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled'
): Promise<AppointmentRequest> {
  const { data } = await api.patch<AppointmentRequest>(`/appointments/${id}`, { status });
  return data;
}
