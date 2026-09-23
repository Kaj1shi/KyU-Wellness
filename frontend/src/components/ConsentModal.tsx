import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentModal({ open, onAccept, onDecline }: ConsentModalProps) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card max-h-[90vh] max-w-lg overflow-y-auto p-6"
      >
        <h2 id="consent-title" className="mb-4 text-xl font-semibold text-slate-800">
          {t('consent.title')}
        </h2>
        <div className="space-y-3 text-sm text-slate-600">
          <p>{t('consent.p1')}</p>
          <p>
            <strong>{t('consent.p2Strong')}</strong> {t('consent.p2Rest')}
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>{t('consent.li1')}</li>
            <li>{t('consent.li2')}</li>
            <li>{t('consent.li3')}</li>
            <li>{t('consent.li4')}</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {t('consent.decline')}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-xl bg-green-400 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:opacity-90"
          >
            {t('consent.accept')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
