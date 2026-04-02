import type { SupportedLocale } from '../../shared/types'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['pt-BR', 'en', 'es']

export const DEFAULT_LOCALE: SupportedLocale = 'pt-BR'

export const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  'pt-BR': '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
}
