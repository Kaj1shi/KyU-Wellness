import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listEscalations, updateEscalation } from '../../services/api';
import type { Escalation } from '../../types/escalation';

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  acknowledged: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-700',
};

export default function CounselorAlertsPage() {
  const [items, setItems] = useState<Escalation[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listEscalations(filter || undefined);
      setItems(data);
    } catch {
      setError('Could not load crisis alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const onUpdate = async (id: string, status: 'acknowledged' | 'resolved') => {
    try {
      await updateEscalation(id, {
        status,
        counselor_notes: notes[id]?.trim() || undefined,
      });
      await load();
    } catch {
      setError('Could not update escalation.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/counselor/dashboard"
              className="mb-2 inline-block text-sm font-medium text-calm-500 hover:underline"
            >
              ← Counselor dashboard
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Crisis alerts</h1>
            <p className="text-sm text-slate-500">
              Live escalations from student chat distress detection.
            </p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading alerts…</p>
        ) : items.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">No crisis alerts found.</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const excerpt =
                (item.distress_snapshot?.message_excerpt as string | undefined) ||
                'No message excerpt available.';
              const studentName =
                item.student?.nickname ||
                item.student?.email ||
                (item.student?.is_anonymous ? 'Anonymous guest' : 'Anonymous student');

              return (
                <article key={item.id} className="card p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusColors[item.status]}`}
                    >
                      {item.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {item.level}
                    </span>
                    {item.student?.is_anonymous && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                        Guest
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-slate-800">{studentName}</h2>
                  {item.student?.faculty && (
                    <p className="text-sm text-slate-500">{item.student.faculty}</p>
                  )}

                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    &ldquo;{excerpt}&rdquo;
                  </p>

                  {item.student?.id && (
                    <Link
                      to={`/counselor/students/${item.student.id}`}
                      className="mt-2 inline-block text-sm font-medium text-calm-500 hover:underline"
                    >
                      View student profile
                    </Link>
                  )}

                  {item.counselor_notes && (
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-medium">Notes:</span> {item.counselor_notes}
                    </p>
                  )}

                  {item.status !== 'resolved' && (
                    <textarea
                      value={notes[item.id] ?? item.counselor_notes ?? ''}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Counselor notes (optional)"
                      rows={2}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => onUpdate(item.id, 'acknowledged')}
                        className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200"
                      >
                        Acknowledge
                      </button>
                    )}
                    {item.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => onUpdate(item.id, 'resolved')}
                        className="rounded-xl bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-200"
                      >
                        Mark resolved
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
