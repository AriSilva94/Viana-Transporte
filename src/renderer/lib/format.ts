import type { SupportedLocale } from '../../shared/types'
import { parseLocalDate } from '../../shared/date'

export const BUSINESS_CURRENCY = 'BRL'
export const BUSINESS_CURRENCY_LOCALE: SupportedLocale = 'pt-BR'

export function formatCurrency(value: number, locale: SupportedLocale): string {
  void locale

  return new Intl.NumberFormat(BUSINESS_CURRENCY_LOCALE, {
    style: 'currency',
    currency: BUSINESS_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(
  value: Date | string | number | null | undefined,
  locale: SupportedLocale
): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const date = parseLocalDate(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDecimal(
  value: number,
  locale: SupportedLocale,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options,
  }).format(value)
}
