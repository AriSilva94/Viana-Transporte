import type { SupportedLocale } from '../../shared/types'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../i18n/config'

const SUPPORTED_LOCALE_SET = new Set<SupportedLocale>(SUPPORTED_LOCALES)
const LOCALE_PATTERNS: Record<SupportedLocale, RegExp> = {
  'pt-BR': /^pt(?:-(?:[a-z]{2,8}|\d{3}))*$/i,
  en: /^en(?:-(?:[a-z]{2,8}|\d{3}))*$/i,
  es: /^es(?:-(?:[a-z]{2,8}|\d{3}))*$/i,
}

export function normalizeLocale(input?: string | null): SupportedLocale {
  const normalized = input?.trim().toLowerCase().replace(/_/g, '-')

  if (!normalized) {
    return DEFAULT_LOCALE
  }

  if (LOCALE_PATTERNS['pt-BR'].test(normalized)) {
    return 'pt-BR'
  }

  if (LOCALE_PATTERNS.en.test(normalized)) {
    return 'en'
  }

  if (LOCALE_PATTERNS.es.test(normalized)) {
    return 'es'
  }

  return DEFAULT_LOCALE
}

export function resolveInitialLocale(
  saved?: string | null,
  systemLocale?: string | null
): SupportedLocale {
  if (saved && SUPPORTED_LOCALE_SET.has(saved as SupportedLocale)) {
    return saved as SupportedLocale
  }

  return normalizeLocale(systemLocale)
}
