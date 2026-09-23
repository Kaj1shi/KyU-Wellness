import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import lg from './locales/lg.json';

export const SUPPORTED_LANGS = ['en', 'lg'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGS)[number];

const STORAGE_KEY = 'kyu-wellness-lang';

function readStoredLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'lg') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    lg: { translation: lg },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  const lang = lng === 'lg' ? 'lg' : 'en';
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'lg' ? 'lg' : 'en';
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language === 'lg' ? 'lg' : 'en';
}

export default i18n;
