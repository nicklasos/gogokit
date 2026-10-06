import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { setFormatLanguage } from '@/shared/utils/format'

import enTranslation from '../locales/en/translation.json'
import ukTranslation from '../locales/uk/translation.json'

const resources = {
  en: { translation: enTranslation },
  uk: { translation: ukTranslation },
}

const savedLanguage = localStorage.getItem('i18nextLng')
const initialLanguage =
  savedLanguage && ['en', 'uk'].includes(savedLanguage) ? savedLanguage : 'en'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    debug: false,
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

setFormatLanguage(i18n.language)
i18n.on('languageChanged', setFormatLanguage)

export default i18n
