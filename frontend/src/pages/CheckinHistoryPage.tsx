import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getCheckins } from '../services/dashboard';
import type { DailyCheckin } from '../types/dashboard';

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function LevelCell({ value, kind }: { value: number | null; kind: 'energy' | 'stress' | 'sleep' }) {
  if (value == null) {
    return <span className="text-slate-400">—</span>;
  }

  const highIsGood = kind !== 'stress';
  const tone =
    value >= 4
      ? highIsGood
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
      : value <= 2
        ? highIsGood
          ? 'bg-amber-100 text-amber-900'
          : 'bg-green-100 text-green-800'
        : 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex min-w-[2.5rem] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {value}/5
    </span>
  );
}

export default function CheckinHistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const rows = await getCheckins(90);
        if (!cancelled) setItems(rows);
      } catch {
        if (!cancelled) setError('Could not load your check-in history.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isGuest = !!user?.is_anonymous;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Daily check-ins</h1>
            <p className="mt-1 text-sm text-slate-500">
              Your energy, stress, and sleep quality over time.
            </p>
          </div>
          <Link to="/dashboard" className="text-sm font-medium text-calm-500 hover:underline">
            ← Back to dashboard
          </Link>
        </div>

        {isGuest && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50/50 px-4 py-3 text-sm text-slate-700">
            Guest mode cannot save check-ins.{' '}
            <Link to="/auth/register" className="font-medium text-calm-500 hover:underline">
              Register
            </Link>{' '}
            to keep a history you can review in this table.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading check-ins…</p>
        ) : items.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">
            No check-ins yet.{' '}
            <Link to="/dashboard" className="font-medium text-calm-500 hover:underline">
              Log one on your dashboard
            </Link>
            .
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Energy</th>
                    <th className="px-4 py-3 font-semibold">Stress</th>
                    <th className="px-4 py-3 font-semibold">Sleep</th>
                    <th className="px-4 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                        {formatWhen(row.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <LevelCell value={row.energy_level} kind="energy" />
                      </td>
                      <td className="px-4 py-3">
                        <LevelCell value={row.stress_level} kind="stress" />
                      </td>
                      <td className="px-4 py-3">
                        <LevelCell value={row.sleep_quality} kind="sleep" />
                      </td>
                      <td className="max-w-xs px-4 py-3 text-slate-600">
                        {row.notes?.trim() ? row.notes : <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              Showing {items.length} check-in{items.length === 1 ? '' : 's'} (newest first).
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
