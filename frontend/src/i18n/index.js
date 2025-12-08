import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import ptBRCommon from './locales/pt-BR/common.json';
import ptBRLogin from './locales/pt-BR/login.json';
import ptBRDashboard from './locales/pt-BR/dashboard.json';
import ptBRSearch from './locales/pt-BR/search.json';
import ptBRUpload from './locales/pt-BR/upload.json';
import ptBRUsers from './locales/pt-BR/users.json';
import ptBRCompare from './locales/pt-BR/compare.json';
import ptBRHcp from './locales/pt-BR/hcp.json';

import enCommon from './locales/en/common.json';
import enLogin from './locales/en/login.json';
import enDashboard from './locales/en/dashboard.json';
import enSearch from './locales/en/search.json';
import enUpload from './locales/en/upload.json';
import enUsers from './locales/en/users.json';
import enCompare from './locales/en/compare.json';
import enHcp from './locales/en/hcp.json';

import esCommon from './locales/es/common.json';
import esLogin from './locales/es/login.json';
import esDashboard from './locales/es/dashboard.json';
import esSearch from './locales/es/search.json';
import esUpload from './locales/es/upload.json';
import esUsers from './locales/es/users.json';
import esCompare from './locales/es/compare.json';
import esHcp from './locales/es/hcp.json';

const resources = {
  'pt-BR': {
    common: ptBRCommon,
    login: ptBRLogin,
    dashboard: ptBRDashboard,
    search: ptBRSearch,
    upload: ptBRUpload,
    users: ptBRUsers,
    compare: ptBRCompare,
    hcp: ptBRHcp
  },
  en: {
    common: enCommon,
    login: enLogin,
    dashboard: enDashboard,
    search: enSearch,
    upload: enUpload,
    users: enUsers,
    compare: enCompare,
    hcp: enHcp
  },
  es: {
    common: esCommon,
    login: esLogin,
    dashboard: esDashboard,
    search: esSearch,
    upload: esUpload,
    users: esUsers,
    compare: esCompare,
    hcp: esHcp
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en', 'es'],

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    ns: ['common', 'login', 'dashboard', 'search', 'upload', 'users', 'compare', 'hcp'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;

// Helper function to get current locale for date/number formatting
export const getLocale = () => {
  const lng = i18n.language;
  const localeMap = {
    'pt-BR': 'pt-BR',
    'en': 'en-US',
    'es': 'es-ES'
  };
  return localeMap[lng] || 'pt-BR';
};

// Format date according to current language
export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  const locale = getLocale();
  return new Date(date).toLocaleDateString(locale, options);
};

// Format date and time according to current language
export const formatDateTime = (date, options = {}) => {
  if (!date) return '-';
  const locale = getLocale();
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  return new Date(date).toLocaleString(locale, defaultOptions);
};

// Format number according to current language
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined) return '-';
  const locale = getLocale();
  return new Intl.NumberFormat(locale, options).format(number);
};

// Format percentage
export const formatPercent = (value, decimals = 0) => {
  if (value === null || value === undefined) return '-';
  const locale = getLocale();
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};
