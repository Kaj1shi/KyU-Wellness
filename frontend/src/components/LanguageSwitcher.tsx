import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '../i18n';

export default function LanguageSwitcher({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  const { i18n, t } = useTranslation();
  const current: AppLanguage = i18n.language?.startsWith('lg') ? 'lg' : 'en';

  const setLang = (lang: AppLanguage) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div
      className={['inline-flex items-center rounded-xl bg-slate-100/80 p-0.5', className].join(' ')}
      role="group"
      aria-label={t('common.language')}
    >
      {(['en', 'lg'] as const).map((lang) => {
        const active = current === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLang(lang)}
            className={[
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
              active
                ? 'bg-white text-calm-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
            aria-pressed={active}
          >
            {compact ? lang.toUpperCase() : lang === 'en' ? t('common.english') : t('common.luganda')}
          </button>
        );
      })}
    </div>
  );
}
