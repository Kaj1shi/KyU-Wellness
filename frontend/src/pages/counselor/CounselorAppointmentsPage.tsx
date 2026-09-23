import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { listAppointments, updateAppointmentStatus } from '../../services/support';
import type { AppointmentRequest } from '../../types/support';

const statusClass: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

export default function CounselorAppointmentsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<AppointmentRequest[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listAppointments(filter || undefined));
    } catch {
      setError(t('counselorAppointments.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const onStatus = async (
    id: string,
    status: 'pending' | 'scheduled' | 'completed' | 'cancelled'
  ) => {
    try {
      await updateAppointmentStatus(id, status);
      await load();
    } catch {
      setError(t('counselorAppointments.updateError'));
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/counselor/dashboard"
          className="mb-2 inline-block text-sm font-medium text-calm-500 hover:underline"
        >
          ← {t('counselorAppointments.back')}
        </Link>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t('counselorAppointments.title')}
            </h1>
            <p className="text-sm text-slate-500">{t('counselorAppointments.subtitle')}</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">{t('counselorAppointments.all')}</option>
            <option value="pending">pending</option>
            <option value="scheduled">scheduled</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">{t('counselorAppointments.loading')}</p>
        ) : items.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">
            {t('counselorAppointments.empty')}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="card p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusClass[item.status] || 'bg-slate-100'}`}
                  >
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {item.student_label || t('counselorAppointments.student')}
                </h2>
                {item.student_email && (
                  <p className="text-sm text-slate-500">{item.student_email}</p>
                )}
                {item.user_id && (
                  <Link
                    to={`/counselor/students/${item.user_id}`}
                    className="mt-1 inline-block text-sm font-medium text-calm-500 hover:underline"
                  >
                    View student profile
                  </Link>
                )}
                {item.preferred_date && (
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-medium">{t('appointments.preferredDate')}:</span>{' '}
                    {item.preferred_date}
                  </p>
                )}
                {item.reason && (
                  <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    {item.reason}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onStatus(item.id, 'scheduled')}
                      className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-medium text-blue-800"
                    >
                      {t('counselorAppointments.schedule')}
                    </button>
                  )}
                  {item.status !== 'completed' && item.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onStatus(item.id, 'completed')}
                      className="rounded-xl bg-green-100 px-3 py-2 text-sm font-medium text-green-800"
                    >
                      {t('counselorAppointments.complete')}
                    </button>
                  )}
                  {item.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onStatus(item.id, 'cancelled')}
                      className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      {t('counselorAppointments.cancel')}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
