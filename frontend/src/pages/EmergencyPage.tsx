import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  emergencyContacts,
  primaryEmergencySms,
  primaryEmergencyTel,
} from '../data/emergencyContacts';

const supportLinks = [
  {
    labelKey: 'resources.whoSuicide' as const,
    href: 'https://www.who.int/news-room/fact-sheets/detail/suicide',
  },
  { labelKey: 'resources.befrienders' as const, href: 'https://www.befrienders.org/' },
  { labelKey: 'resources.unicef' as const, href: 'https://www.unicef.org/parenting/mental-health' },
];

export default function EmergencyPage() {
  const { t } = useTranslation();

  const immediateSteps = [t('emergency.step1'), t('emergency.step2'), t('emergency.step3')];
  const groundingTips = [t('emergency.ground1'), t('emergency.ground2'), t('emergency.ground3')];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-3xl border border-red-100 bg-red-50/70 p-6">
          <h1 className="text-2xl font-bold text-red-800">{t('emergency.title')}</h1>
          <p className="mt-2 text-sm text-red-900/90">{t('emergency.lead')}</p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="card p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">{t('emergency.nowTitle')}</h2>
            <div className="space-y-3 text-sm text-slate-700">
              {immediateSteps.map((step, i) => (
                <p key={step}>
                  <span className="font-semibold">{i + 1}.</span> {step}
                </p>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              {t('emergency.notReplacement')}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">{t('emergency.groundingTitle')}</h2>
            <div className="space-y-3 text-sm text-slate-700">
              {groundingTips.map((tip) => (
                <p key={tip}>- {tip}</p>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <a
                href={`tel:${primaryEmergencyTel}`}
                className="rounded-xl bg-calm-300 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-calm-200"
              >
                {t('emergency.call')} ({primaryEmergencyTel})
              </a>
              <a
                href={`sms:${primaryEmergencySms}`}
                className="rounded-xl bg-green-400 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-200"
              >
                {t('emergency.text')} ({primaryEmergencySms})
              </a>
            </div>
          </section>
        </div>

        <section className="card mt-6 p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">{t('emergency.contactsTitle')}</h2>
          <div className="space-y-3">
            {emergencyContacts.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm"
              >
                <p className="font-semibold text-slate-800">{t(c.nameKey)}</p>
                <p className="mt-1 text-slate-600">{t(c.detailKey)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.tel && (
                    <a
                      href={`tel:${c.tel}`}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-calm-600 ring-1 ring-slate-200"
                    >
                      {t('emergency.call')} {c.tel}
                    </a>
                  )}
                  {c.sms && (
                    <a
                      href={`sms:${c.sms}`}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-slate-200"
                    >
                      SMS {c.sms}
                    </a>
                  )}
                  {c.href && (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                    >
                      {t('common.openLink')}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card mt-6 p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">{t('emergency.linksTitle')}</h2>
          <div className="grid gap-2">
            {supportLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                {t(link.labelKey)}
              </a>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
