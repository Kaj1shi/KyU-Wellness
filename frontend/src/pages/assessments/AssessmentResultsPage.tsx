import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SeverityBadge from '../../components/SeverityBadge';
import {
  getAssessmentById,
  getAssessmentResults,
  getAssessmentTrends,
} from '../../services/assessment';
import type { AssessmentResult, AssessmentTrends, AssessmentType } from '../../types/assessment';
import { ASSESSMENT_META } from '../../types/assessment';

const SEVERITY_COLORS = {
  low: '#00a53c',
  moderate: '#ffc400',
  high: '#fd0000',
};

function ScoreRing({ score, maxScore, severity }: { score: number; maxScore: number; severity: string }) {
  const percent = Math.round((score / maxScore) * 100);
  const color =
    severity === 'high' ? '#f80000' : severity === 'moderate' ? '#ffc400' : '#00a53c';

  return (
    <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e8f0fe" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${percent * 2.64} 264`}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-bold text-slate-800">
          {score}
          <span className="text-lg text-slate-400">/{maxScore}</span>
        </p>
        <p className="text-xs text-slate-500">Score</p>
      </div>
    </div>
  );
}

function SingleResult({ result }: { result: AssessmentResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{result.title}</h2>
          <p className="text-xs text-slate-400">
            {new Date(result.completed_at).toLocaleString()}
          </p>
        </div>
        <SeverityBadge severity={result.severity} />
      </div>

      <ScoreRing score={result.score} maxScore={result.max_score} severity={result.severity} />

      <p className="mt-4 text-center text-sm text-slate-600">{result.severity_label}</p>

      {result.wellness_tips.length > 0 && (
        <div className="mt-6 rounded-xl bg-calm-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Recommended next steps</h3>
          <ul className="space-y-1.5 text-sm text-slate-600">
            {result.wellness_tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span aria-hidden="true">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

export function AssessmentResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getAssessmentById(id)
      .then(setResult)
      .catch(() => setError('Result not found.'));
  }, [id]);

  if (error) return <p className="py-16 text-center text-red-500">{error}</p>;
  if (!result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-calm-200 border-t-calm-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Link to="/assessments/results" className="mb-6 inline-block text-sm text-calm-400 hover:underline">
        ← All results
      </Link>
      <SingleResult result={result} />
      <div className="mt-6 flex gap-3">
        <Link
          to={`/assessments/${result.assessment_type}`}
          className="flex-1 rounded-xl border border-calm-200 py-2.5 text-center text-sm font-medium text-calm-500 hover:bg-calm-50"
        >
          Retake
        </Link>
        <Link
          to="/assessments"
          className="flex-1 rounded-xl bg-green-400 py-2.5 text-center text-sm font-semibold text-white"
        >
          All assessments
        </Link>
      </div>
    </div>
  );
}

export default function AssessmentResultsPage() {
  const [latest, setLatest] = useState<Record<string, AssessmentResult | null>>({});
  const [trends, setTrends] = useState<AssessmentTrends | null>(null);

  useEffect(() => {
    Promise.all([getAssessmentResults(), getAssessmentTrends()])
      .then(([results, trendData]) => {
        setLatest(results.latest);
        setTrends(trendData);
      })
      .catch(() => {});
  }, []);

  const chartData = (['phq9', 'gad7', 'stress'] as AssessmentType[]).map((type) => {
    const item = latest[type];
    const meta = ASSESSMENT_META[type];
    return {
      name: meta.title.split(' ')[0],
      score: item?.score ?? 0,
      max: item?.max_score ?? 0,
      severity: item?.severity ?? 'low',
      hasData: !!item,
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your Assessment Results</h1>
          <p className="text-sm text-slate-500">Track your emotional wellness over time</p>
        </div>
        <Link
          to="/assessments"
          className="rounded-xl bg-green-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
        >
          Take an assessment
        </Link>
      </div>

      <div className="mb-8 card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Latest scores</h2>
        {chartData.some((d) => d.hasData) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData.filter((d) => d.hasData)} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f0fe" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {chartData
                  .filter((d) => d.hasData)
                  .map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SEVERITY_COLORS[entry.severity as keyof typeof SEVERITY_COLORS]}
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">
            No assessments yet. Complete one to see your scores here.
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(['phq9', 'gad7', 'stress'] as AssessmentType[]).map((type) => {
          const item = latest[type];
          if (!item) {
            return (
              <div key={type} className="card p-6 text-center">
                <p className="mb-3 text-sm text-slate-500">Not taken yet</p>
                <Link
                  to={`/assessments/${type}`}
                  className="text-sm font-medium text-calm-400 hover:underline"
                >
                  Start →
                </Link>
              </div>
            );
          }
          return (
            <Link key={type} to={`/assessments/results/${item.id}`} className="block">
              <SingleResult result={item} />
            </Link>
          );
        })}
      </div>

      {trends && (
        <div className="mt-8 card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Score history</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {(['phq9', 'gad7', 'stress'] as const).map((key) => (
              <div key={key}>
                <p className="mb-2 text-sm font-medium text-slate-600">
                  {ASSESSMENT_META[key].title}
                </p>
                {trends[key].length === 0 ? (
                  <p className="text-xs text-slate-400">No history</p>
                ) : (
                  <ul className="space-y-1 text-xs text-slate-500">
                    {trends[key].map((p) => (
                      <li key={p.date} className="flex justify-between">
                        <span>{p.date}</span>
                        <span className="font-medium text-slate-700">{p.score}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-400">
        These results are screening indicators only — not a clinical diagnosis. Seek professional
        help if you are concerned.
      </p>
    </div>
  );
}
