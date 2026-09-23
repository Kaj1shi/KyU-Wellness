import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const { t } = useTranslation();

  const steps = [t('about.how1'), t('about.how2'), t('about.how3'), t('about.how4')];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">{t('about.title')}</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">{t('about.subtitle')}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800">{t('about.missionTitle')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{t('about.missionBody')}</p>
          </section>
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800">{t('about.whoTitle')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{t('about.whoBody')}</p>
          </section>
        </div>

        <section className="card mt-6 p-6">
          <h2 className="text-lg font-semibold text-slate-800">{t('about.howTitle')}</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-100 text-xs font-bold text-green-600">
                  {i + 1}
                </span>
                <span className="pt-1 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-3xl border border-amber-100 bg-amber-50/70 p-6">
          <h2 className="text-lg font-semibold text-amber-950">{t('about.ethicsTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/90">{t('about.ethicsBody')}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/resources"
              className="rounded-xl bg-green-400 px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
            >
              {t('about.ctaResources')}
            </Link>
            <Link
              to="/emergency"
              className="rounded-xl border border-amber-200 bg-white/70 px-4 py-2.5 text-center text-sm font-semibold text-amber-950 hover:bg-amber-100/60"
            >
              {t('about.ctaEmergency')}
            </Link>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
