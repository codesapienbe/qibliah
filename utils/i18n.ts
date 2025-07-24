import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en/translation.json';
import nl from '../locales/nl/translation.json';
import tr from '../locales/tr/translation.json';

const resources = {
  en: { translation: en },
  nl: { translation: nl },
  tr: { translation: tr },
};

const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n; 