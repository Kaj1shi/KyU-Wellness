import { Link } from 'react-router-dom';
import SeverityBadge from '../SeverityBadge';
import type { AssessmentResult, AssessmentType } from '../../types/assessment';
import { ASSESSMENT_META } from '../../types/assessment';

const TYPES: AssessmentType[] = ['phq9', 'gad7', 'stress'];

interface AssessmentOverviewProps {
  latest: Record<AssessmentType, AssessmentResult | null>;
}

export default function AssessmentOverview({ latest }: AssessmentOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {TYPES.map((type) => {
        const result = latest[type];
        const meta = ASSESSMENT_META[type];
        return (
          <div key={type} className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">{meta.title}</h3>
            </div>
            {result ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-800">
                    {result.score}
                    <span className="text-sm text-slate-400">/{result.max_score}</span>
                  </span>
                  <SeverityBadge severity={result.severity} />
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(result.completed_at).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="mb-3 text-sm text-slate-500">Not taken yet</p>
            )}
            <Link
              to={`/assessments/${type}`}
              className="mt-3 block text-center text-xs font-medium text-calm-500 hover:underline"
            >
              {result ? 'Retake' : 'Start'} assessment
            </Link>
          </div>
        );
      })}
    </div>
  );
}
