import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { listMyFeedback, submitFeedback } from '../services/support';
import type { FeedbackItem } from '../types/support';

export default function FeedbackPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setItems(await listMyFeedback());
    } catch {
      setError(t('feedback.loadError'));
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
    setSuccess('');
    try {
      await submitFeedback({
        rating,
        comment: comment.trim() || undefined,
      });
      setComment('');
      setSuccess(t('feedback.thanks'));
      await load();
    } catch {
      setError(t('feedback.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-800">{t('feedback.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('feedback.subtitle')}</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('feedback.rating')}
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} — {t(`feedback.star${n}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('feedback.comment')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder={t('feedback.commentPlaceholder')}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-calm-300 px-4 py-2 text-sm font-semibold text-white hover:bg-calm-200 disabled:opacity-60"
          >
            {t('feedback.submit')}
          </button>
        </form>

        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t('feedback.history')}
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">{t('feedback.loading')}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">{t('feedback.empty')}</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="card p-4 text-sm">
                <div className="flex justify-between gap-2 text-xs text-slate-500">
                  <span>{item.rating ? `${item.rating}/5` : '—'}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                {item.comment && <p className="mt-2 text-slate-700">{item.comment}</p>}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
