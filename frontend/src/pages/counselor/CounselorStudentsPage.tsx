import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listCounselorStudents } from '../../services/counselor';
import type { StudentCaseloadItem } from '../../types/counselor';

const severityBadge: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  moderate: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-700',
};

export default function CounselorStudentsPage() {
  const [items, setItems] = useState<StudentCaseloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setError('');
      try {
        const students = await listCounselorStudents();
        setItems(students);
      } catch {
        setError('Could not load student caseload.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Student caseload</h1>
          <p className="text-sm text-slate-500">
            Students with escalations or elevated assessment scores, sorted by urgency.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading students…</p>
        ) : items.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">No students found.</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Faculty</th>
                    <th className="px-4 py-3 font-semibold">Open alerts</th>
                    <th className="px-4 py-3 font-semibold">Total escalations</th>
                    <th className="px-4 py-3 font-semibold">Latest assessment</th>
                    <th className="px-4 py-3 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((student) => {
                    const name =
                      student.nickname ||
                      student.email ||
                      (student.is_anonymous ? 'Anonymous guest' : 'Student');
                    return (
                      <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{name}</div>
                          {student.is_anonymous && (
                            <div className="text-xs text-slate-500">Guest account</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{student.faculty || '—'}</td>
                        <td className="px-4 py-3">
                          {student.open_escalations > 0 ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              {student.open_escalations}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{student.escalation_count}</td>
                        <td className="px-4 py-3">
                          {student.latest_assessment_severity ? (
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${severityBadge[student.latest_assessment_severity] || 'bg-slate-100 text-slate-700'}`}
                            >
                              {student.latest_assessment_severity}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/counselor/students/${student.id}`}
                            className="font-medium text-calm-500 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
