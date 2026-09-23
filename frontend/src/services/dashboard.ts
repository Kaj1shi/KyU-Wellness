import { api } from './api';
import type { DailyCheckin, DashboardData, MoodEntry } from '../types/dashboard';

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/dashboard');
  return data;
}

export async function logMood(mood_score: number, notes?: string): Promise<MoodEntry> {
  const { data } = await api.post<MoodEntry>('/wellness/mood', { mood_score, notes });
  return data;
}

export async function logCheckin(payload: {
  energy_level: number;
  stress_level: number;
  sleep_quality?: number;
  notes?: string;
}): Promise<DailyCheckin> {
  const { data } = await api.post<DailyCheckin>('/wellness/checkin', payload);
  return data;
}

export async function getCheckins(limit = 60): Promise<DailyCheckin[]> {
  const { data } = await api.get<DailyCheckin[]>('/wellness/checkin', {
    params: { limit },
  });
  return data;
}
