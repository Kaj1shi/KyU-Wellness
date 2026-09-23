import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { listAllFeedback } from '../../services/support';
import type { FeedbackItem } from '../../types/support';

export default function CounselorFeedbackPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setItems(await listAllFeedback());
      } catch {
        setError(t('counselorFeedback.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/counselor/dashboard"
          className="mb-2 inline-block text-sm font-medium text-calm-500 hover:underline"
        >
          ← {t('counselorFeedback.back')}
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">{t('counselorFeedback.title')}</h1>
        <p className="text-sm text-slate-500">{t('counselorFeedback.subtitle')}</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">{t('counselorFeedback.loading')}</p>
        ) : items.length === 0 ? (
          <div className="card mt-6 p-8 text-center text-sm text-slate-500">
            {t('counselorFeedback.empty')}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {item.student_label || t('counselorFeedback.student')}
                  </span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                {item.user_id && (
                  <Link
                    to={`/counselor/students/${item.user_id}`}
                    className="mt-1 inline-block text-sm font-medium text-calm-500 hover:underline"
                  >
                    View student profile
                  </Link>
                )}
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {item.rating ? `${item.rating}/5` : t('counselorFeedback.noRating')}
                </p>
                {item.comment && <p className="mt-1 text-sm text-slate-600">{item.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
