import type {ParseKeys} from 'i18next';
import i18next, {type i18n as I18nInstance} from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {initReactI18next} from 'react-i18next';

const NAMESPACES = [
  'common',
  'home',
  'locationSwitcher',
  'locations',
  'navigation',
  'parts',
  'sign-in',
  'userSettings',
  'users',
] as const;

const i18n: I18nInstance = i18next.createInstance();

// Import English translations
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enLocationSwitcher from './locales/en/locationSwitcher.json';
import enLocations from './locales/en/locations.json';
import enNavigation from './locales/en/navigation.json';
import enParts from './locales/en/parts.json';
import enSignIn from './locales/en/sign-in.json';
import enUserSettings from './locales/en/userSettings.json';
import enUsers from './locales/en/users.json';

// Import French translations
import frCommon from './locales/fr/common.json';
import frHome from './locales/fr/home.json';
import frLocationSwitcher from './locales/fr/locationSwitcher.json';
import frLocations from './locales/fr/locations.json';
import frNavigation from './locales/fr/navigation.json';
import frParts from './locales/fr/parts.json';
import frSignIn from './locales/fr/sign-in.json';
import frUserSettings from './locales/fr/userSettings.json';
import frUsers from './locales/fr/users.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    initImmediate: false,
    resources: {
      en: {
        common: enCommon,
        home: enHome,
        locationSwitcher: enLocationSwitcher,
        locations: enLocations,
        navigation: enNavigation,
        parts: enParts,
        'sign-in': enSignIn,
        userSettings: enUserSettings,
        users: enUsers,
      },
      fr: {
        common: frCommon,
        home: frHome,
        locationSwitcher: frLocationSwitcher,
        locations: frLocations,
        navigation: frNavigation,
        parts: frParts,
        'sign-in': frSignIn,
        userSettings: frUserSettings,
        users: frUsers,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    fallbackNS: 'common',
    ns: [
      'common',
      'home',
      'locationSwitcher',
      'locations',
      'navigation',
      'parts',
      'sign-in',
      'userSettings',
      'users',
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;

// Typed wrapper so callers outside React (e.g. AppLoading, columns.tsx) get the same
// key-safety as useTranslation() without having to cast the raw i18n instance.
export const t = i18n.t.bind(i18n) as (
  key: ParseKeys<typeof NAMESPACES>,
  options?: Record<string, unknown>,
) => string;
