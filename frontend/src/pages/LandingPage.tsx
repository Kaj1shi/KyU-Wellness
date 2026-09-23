import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { checkHealth, type HealthResponse } from '../services/api';

export default function LandingPage() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState(false);

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch(() => setHealthError(true));
  }, []);

  const features = [
    { title: t('landing.featureChatTitle'), desc: t('landing.featureChatDesc') },
    { title: t('landing.featureAssessTitle'), desc: t('landing.featureAssessDesc') },
    { title: t('landing.featureCrisisTitle'), desc: t('landing.featureCrisisDesc') },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
      <section className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="mb-4 inline-block rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-600 sm:px-4 sm:text-sm">
            {t('landing.badge')}
          </span>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-800 sm:mb-6 sm:text-5xl lg:text-6xl">
            {t('landing.titleBefore')}{' '}
            <span className="bg-green-500 bg-clip-text text-transparent">
              {t('landing.titleHighlight')}
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-600 sm:mb-10 sm:text-lg">
            {t('landing.subtitle')}
          </p>

          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              to="/auth/register"
              className="rounded-2xl bg-green-400 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:opacity-80 sm:px-8 sm:py-4 sm:text-lg"
            >
              {t('landing.ctaStart')}
            </Link>
            <Link
              to="/auth/guest"
              className="rounded-2xl border border-calm-200 bg-white/80 px-6 py-3.5 text-base font-semibold text-calm-500 transition hover:bg-calm-100 sm:px-8 sm:py-4 sm:text-lg"
            >
              {t('landing.ctaGuest')}
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:mt-20 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * i }}
            className="card p-5 sm:p-6"
          >
            <h3 className="mb-2 text-lg font-semibold text-slate-800">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {health && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card mx-auto mt-10 max-w-md p-4 text-center text-sm sm:mt-12"
        >
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full ${
              health.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          API {health.status} · Database {health.database}
        </motion.div>
      )}

      {healthError && (
        <p className="mt-8 px-2 text-center text-sm text-amber-600">{t('landing.apiStarting')}</p>
      )}
    </div>
  );
}
