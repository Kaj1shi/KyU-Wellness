import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">{t('privacy.title')}</h1>
        <p className="mt-2 text-sm text-slate-500">{t('privacy.updated')}</p>
        <p className="mt-4 text-slate-600 leading-relaxed">{t('privacy.intro')}</p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800">{t('privacy.collectTitle')}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>{t('privacy.collect1')}</li>
              <li>{t('privacy.collect2')}</li>
              <li>{t('privacy.collect3')}</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800">{t('privacy.useTitle')}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>{t('privacy.use1')}</li>
              <li>{t('privacy.use2')}</li>
              <li>{t('privacy.use3')}</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800">{t('privacy.shareTitle')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{t('privacy.shareBody')}</p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800">{t('privacy.rightsTitle')}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>{t('privacy.rights1')}</li>
              <li>{t('privacy.rights2')}</li>
              <li>{t('privacy.rights3')}</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-6">
            <h2 className="text-lg font-semibold text-amber-950">{t('privacy.disclaimerTitle')}</h2>
            <p className="mt-2 text-sm text-amber-950/90">{t('privacy.disclaimerBody')}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/emergency" className="text-sm font-semibold text-amber-900 underline">
                {t('common.emergency')}
              </Link>
              <Link to="/about" className="text-sm font-semibold text-amber-900 underline">
                {t('common.about')}
              </Link>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
