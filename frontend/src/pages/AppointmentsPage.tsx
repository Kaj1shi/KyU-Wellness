import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createAppointment, listMyAppointments } from '../services/support';
import type { AppointmentRequest } from '../types/support';

const statusClass: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<AppointmentRequest[]>([]);
  const [preferredDate, setPreferredDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setItems(await listMyAppointments());
    } catch {
      setError(t('appointments.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAppointment({
        preferred_date: preferredDate.trim() || undefined,
        reason: reason.trim() || undefined,
      });
      setPreferredDate('');
      setReason('');
      await load();
    } catch {
      setError(t('appointments.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-800">{t('appointments.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('appointments.subtitle')}</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={onSubmit} className="card mt-6 space-y-3 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('appointments.preferredDate')}
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('appointments.reason')}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder={t('appointments.reasonPlaceholder')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-calm-300 px-4 py-2 text-sm font-semibold text-white hover:bg-calm-200 disabled:opacity-60"
          >
            {t('appointments.submit')}
          </button>
        </form>

        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t('appointments.history')}
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">{t('appointments.loading')}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">{t('appointments.empty')}</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusClass[item.status] || 'bg-slate-100 text-slate-700'}`}
                  >
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                {item.preferred_date && (
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-medium">{t('appointments.preferredDate')}:</span>{' '}
                    {item.preferred_date}
                  </p>
                )}
                {item.reason && <p className="mt-1 text-sm text-slate-600">{item.reason}</p>}
              </article>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
