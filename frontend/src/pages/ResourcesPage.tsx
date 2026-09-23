import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const externalKeys = [
  { key: 'who', href: 'https://www.who.int/health-topics/mental-health' },
  { key: 'unicef', href: 'https://www.unicef.org/parenting/mental-health' },
  { key: 'mindtools', href: 'https://www.mindtools.com/az4qv7r/stress-management' },
  { key: 'befrienders', href: 'https://www.befrienders.org/' },
  { key: 'whoSuicide', href: 'https://www.who.int/news-room/fact-sheets/detail/suicide' },
] as const;

export default function ResourcesPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">{t('resources.title')}</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">{t('resources.subtitle')}</p>

        <section className="card mt-10 p-6">
          <h2 className="text-lg font-semibold text-slate-800">{t('resources.campusTitle')}</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
            <li className="rounded-xl bg-slate-50 px-4 py-3">{t('resources.campusCounseling')}</li>
            <li className="rounded-xl bg-slate-50 px-4 py-3">{t('resources.campusClinic')}</li>
            <li className="rounded-xl bg-slate-50 px-4 py-3">{t('resources.campusPeer')}</li>
          </ul>
        </section>

        <section className="card mt-6 p-6">
          <h2 className="text-lg font-semibold text-slate-800">{t('resources.externalTitle')}</h2>
          <div className="mt-4 grid gap-2">
            {externalKeys.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <span>{t(`resources.${item.key}`)}</span>
                <span className="text-xs text-slate-400">{t('common.openLink')}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-red-100 bg-red-50/70 p-6">
          <h2 className="text-lg font-semibold text-red-800">{t('resources.crisisTitle')}</h2>
          <p className="mt-2 text-sm text-red-900/90">{t('resources.crisisNote')}</p>
          <Link
            to="/emergency"
            className="mt-4 inline-flex rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
          >
            {t('resources.openEmergency')}
          </Link>
        </section>
      </motion.div>
    </div>
  );
}
