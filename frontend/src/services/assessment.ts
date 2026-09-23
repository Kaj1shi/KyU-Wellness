import { api } from './api';
import type {
  AssessmentHistoryItem,
  AssessmentQuestions,
  AssessmentResult,
  AssessmentSummary,
  AssessmentTrends,
  AssessmentType,
} from '../types/assessment';

export async function getQuestions(type: AssessmentType): Promise<AssessmentQuestions> {
  const { data } = await api.get<AssessmentQuestions>(`/assessment/questions/${type}`);
  return data;
}

export async function submitAssessment(
  assessment_type: AssessmentType,
  responses: Record<string, number>
): Promise<AssessmentResult> {
  const { data } = await api.post<AssessmentResult>('/assessment/submit', {
    assessment_type,
    responses,
  });
  return data;
}

export async function getAssessmentResults(): Promise<AssessmentSummary> {
  const { data } = await api.get<AssessmentSummary>('/assessment/results');
  return data;
}

export async function getAssessmentHistory(
  type?: AssessmentType
): Promise<AssessmentHistoryItem[]> {
  const { data } = await api.get<AssessmentHistoryItem[]>('/assessment/history', {
    params: type ? { assessment_type: type } : undefined,
  });
  return data;
}

export async function getAssessmentTrends(): Promise<AssessmentTrends> {
  const { data } = await api.get<AssessmentTrends>('/assessment/trends');
  return data;
}

export async function getAssessmentById(id: string): Promise<AssessmentResult> {
  const { data } = await api.get<AssessmentResult>(`/assessment/result/${id}`);
  return data;
}
