import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { SupportedLocale } from '../../shared/types'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './config'

const NAMESPACES = [
  'common',
  'navigation',
  'dashboard',
  'dialogs',
  'clients',
  'projects',
  'machines',
  'operators',
  'dailylogs',
  'costs',
  'revenues',
  'reports',
] as const

type TranslationNamespace = (typeof NAMESPACES)[number]
type TranslationResource = Record<string, unknown>
type TranslationModule = { default: TranslationResource }

const localeModules = import.meta.glob<TranslationModule>('./locales/*/*.json', { eager: true })

function getNamespaceResource(
  locale: SupportedLocale,
  namespace: TranslationNamespace
): TranslationResource {
  return localeModules[`./locales/${locale}/${namespace}.json`]?.default ?? {}
}

const resources = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [
    locale,
    Object.fromEntries(
      NAMESPACES.map((namespace) => [namespace, getNamespaceResource(locale, namespace)])
    ),
  ])
) as Record<SupportedLocale, Record<TranslationNamespace, TranslationResource>>

let initializationPromise: Promise<typeof i18n> | undefined

export function initializeI18n(language: SupportedLocale): Promise<typeof i18n> {
  if (i18n.isInitialized) {
    return i18n.changeLanguage(language).then(() => i18n)
  }

  if (!initializationPromise) {
    initializationPromise = i18n
      .use(initReactI18next)
      .init({
        lng: language,
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: SUPPORTED_LOCALES,
        defaultNS: 'common',
        ns: NAMESPACES,
        resources,
        interpolation: {
          escapeValue: false,
        },
      })
      .then(() => i18n)
      .catch((error: unknown) => {
        initializationPromise = undefined
        throw error
      })
  }

  return initializationPromise.then(async () => {
    if (i18n.language !== language) {
      await i18n.changeLanguage(language)
    }

    return i18n
  })
}

export { i18n }
