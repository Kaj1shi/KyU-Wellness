import { api } from './api';
import type {
  CounselorDashboardData,
  StudentCaseloadItem,
  StudentDetail,
} from '../types/counselor';

export async function getCounselorDashboard(): Promise<CounselorDashboardData> {
  const { data } = await api.get<CounselorDashboardData>('/counselor/dashboard');
  return data;
}

export async function listCounselorStudents(limit = 50): Promise<StudentCaseloadItem[]> {
  const { data } = await api.get<StudentCaseloadItem[]>('/counselor/students', {
    params: { limit },
  });
  return data;
}

export async function getCounselorStudentDetail(studentId: string): Promise<StudentDetail> {
  const { data } = await api.get<StudentDetail>(`/counselor/students/${studentId}`);
  return data;
}
