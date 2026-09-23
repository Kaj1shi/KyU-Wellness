import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCounselorStudentDetail } from '../../services/counselor';
import type { StudentDetail } from '../../types/counselor';

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  acknowledged: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-700',
};

export default function CounselorStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      setError('');
      try {
        const detail = await getCounselorStudentDetail(id);
        setData(detail);
      } catch {
        setError('Could not load student details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const student = data?.student;
  const displayName =
    student?.nickname ||
    student?.email ||
    (student?.is_anonymous ? 'Anonymous guest' : 'Student');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/counselor/students"
          className="mb-4 inline-block text-sm font-medium text-calm-500 hover:underline"
        >
          ← Back to caseload
        </Link>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading student profile…</p>
        ) : data && student ? (
          <div className="space-y-6">
            <div className="card p-6">
              <h1 className="text-2xl font-bold text-slate-800">{displayName}</h1>
              {student.is_anonymous && (
                <p className="mt-1 text-sm text-amber-700">
                  Guest account — limited identifying information is available.
                </p>
              )}
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="text-slate-800">{student.email || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Faculty:</span>{' '}
                  <span className="text-slate-800">{student.faculty || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Year of study:</span>{' '}
                  <span className="text-slate-800">{student.year_of_study ?? '—'}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Mood logs', value: data.mood_entries_count },
                  { label: 'Daily check-ins', value: data.checkins_count },
                  { label: 'Chat sessions', value: data.chat_sessions_count },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Assessment history</h2>
              {data.assessments.length === 0 ? (
                <p className="text-sm text-slate-500">No assessments completed.</p>
              ) : (
                <div className="space-y-3">
                  {data.assessments.map((a) => (
                    <div
                      key={`${a.assessment_type}-${a.completed_at}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{a.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(a.completed_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">
                          {a.score}/{a.max_score}
                        </p>
                        <p className="text-xs capitalize text-slate-500">{a.severity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Escalation history</h2>
              {data.escalations.length === 0 ? (
                <p className="text-sm text-slate-500">No escalations on record.</p>
              ) : (
                <div className="space-y-3">
                  {data.escalations.map((item) => {
                    const excerpt =
                      (item.distress_snapshot as { message_excerpt?: string } | undefined)
                        ?.message_excerpt || 'No excerpt';
                    return (
                      <div key={String(item.id)} className="rounded-xl border border-slate-100 p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusColors[String(item.status)] || 'bg-slate-100 text-slate-700'}`}
                          >
                            {String(item.status)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {String(item.level)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(String(item.created_at)).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">&ldquo;{excerpt}&rdquo;</p>
                        {typeof item.counselor_notes === 'string' && item.counselor_notes && (
                          <p className="mt-2 text-sm text-slate-600">
                            <span className="font-medium">Notes:</span> {item.counselor_notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
