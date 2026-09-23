export type AssessmentType = 'phq9' | 'gad7' | 'stress';
export type SeverityLevel = 'low' | 'moderate' | 'high';

export interface QuestionOption {
  value: number;
  label: string;
}

export interface Question {
  id: string;
  text: string;
}

export interface AssessmentQuestions {
  assessment_type: AssessmentType;
  title: string;
  description: string;
  instructions: string;
  options: QuestionOption[];
  questions: Question[];
  max_score: number;
}

export interface AssessmentResult {
  id: string;
  assessment_type: AssessmentType;
  title: string;
  score: number;
  max_score: number;
  severity: SeverityLevel;
  severity_label: string;
  wellness_tips: string[];
  completed_at: string;
}

export interface AssessmentHistoryItem {
  id: string;
  assessment_type: AssessmentType;
  title: string;
  score: number;
  max_score: number;
  severity: SeverityLevel;
  completed_at: string;
}

export interface AssessmentSummary {
  latest: Record<AssessmentType, AssessmentResult | null>;
  history_count: number;
}

export interface TrendPoint {
  date: string;
  score: number;
  severity: SeverityLevel;
}

export interface AssessmentTrends {
  phq9: TrendPoint[];
  gad7: TrendPoint[];
  stress: TrendPoint[];
}

export const ASSESSMENT_META: Record<
  AssessmentType,
  { title: string; description: string; color: string }
> = {
  phq9: {
    title: 'Depression Screening',
    description: 'PHQ-9 based questionnaire to screen for depressive symptoms',
    color: 'calm',
  },
  gad7: {
    title: 'Anxiety Screening',
    description: 'GAD-7 based questionnaire for anxiety symptoms',
    color: 'green',
  },
  stress: {
    title: 'Perceived Stress (PSS-10)',
    description: '10-item Perceived Stress Scale for stress over the past month',
    color: 'calm',
  },
};
