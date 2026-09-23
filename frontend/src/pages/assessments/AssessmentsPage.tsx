import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAssessmentResults } from '../../services/assessment';
import { ASSESSMENT_META, type AssessmentType } from '../../types/assessment';
import SeverityBadge from '../../components/SeverityBadge';

const types: AssessmentType[] = ['phq9', 'gad7', 'stress'];

export default function AssessmentsPage() {
  const { user } = useAuth();
  const [latest, setLatest] = useState<Record<string, { score: number; max_score: number; severity: 'low' | 'moderate' | 'high' } | null>>({});

  useEffect(() => {
    if (user?.role !== 'guest') {
      getAssessmentResults()
        .then((res) => {
          const map: typeof latest = {};
          for (const t of types) {
            const item = res.latest[t];
            map[t] = item
              ? { score: item.score, max_score: item.max_score, severity: item.severity }
              : null;
          }
          setLatest(map);
        })
        .catch(() => {});
    }
  }, [user]);

  if (user?.role === 'guest') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="card p-8 text-center">
          <h1 className="mb-2 text-xl font-bold text-slate-800">Assessments require an account</h1>
          <p className="mb-6 text-sm text-slate-500">
            Register to save your assessment results and track wellness over time.
          </p>
          <Link
            to="/auth/register"
            className="inline-block rounded-xl bg-green-400 px-6 py-2.5 text-sm font-semibold text-white"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold text-slate-800">Wellness Assessments</h1>
        <p className="text-slate-500">
          Screen for depression, anxiety, and stress. These are screening tools — not diagnoses.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((type, i) => {
          const meta = ASSESSMENT_META[type];
          const last = latest[type];

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card flex flex-col p-6"
            >
              <h2 className="mb-1 text-lg font-semibold text-slate-800">{meta.title}</h2>
              <p className="mb-4 flex-1 text-sm text-slate-500">{meta.description}</p>

              {last && (
                <div className="mb-4 rounded-xl bg-calm-50 px-3 py-2 text-sm">
                  <span className="text-slate-500">Last score: </span>
                  <span className="font-semibold text-slate-800">
                    {last.score}/{last.max_score}
                  </span>
                  <div className="mt-1">
                    <SeverityBadge severity={last.severity} />
                  </div>
                </div>
              )}

              <Link
                to={`/assessments/${type}`}
                className="rounded-xl bg-green-400 py-2.5 text-center text-sm font-semibold text-white shadow-md hover:opacity-90"
              >
                {last ? 'Retake assessment' : 'Start assessment'}
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/assessments/results"
          className="text-sm font-medium text-calm-400 hover:underline"
        >
          View all results &amp; trends →
        </Link>
      </div>
    </div>
  );
}
