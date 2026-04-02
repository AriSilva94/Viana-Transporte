import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LOCALES } from '@renderer/i18n/config'
import { normalizeLocale } from '@renderer/lib/locale'
import { cn } from '@renderer/lib/utils'
import type { SupportedLocale } from '../../../shared/types'

function LocaleFlag({ locale }: { locale: SupportedLocale }): JSX.Element {
  if (locale === 'pt-BR') {
    return (
      <svg
        viewBox="0 0 20 14"
        className="h-3.5 w-5 rounded-[3px] shadow-sm"
        aria-hidden="true"
        data-testid="locale-flag-pt-BR"
      >
        <rect width="20" height="14" rx="2" fill="#1F8B4C" />
        <polygon points="10,2 17,7 10,12 3,7" fill="#F6C244" />
        <circle cx="10" cy="7" r="2.6" fill="#2C4C9A" />
      </svg>
    )
  }

  if (locale === 'en') {
    return (
      <svg
        viewBox="0 0 20 14"
        className="h-3.5 w-5 rounded-[3px] shadow-sm"
        aria-hidden="true"
        data-testid="locale-flag-en"
      >
        <rect width="20" height="14" rx="2" fill="#FFFFFF" />
        <rect y="1.2" width="20" height="1.2" fill="#C23B33" />
        <rect y="3.6" width="20" height="1.2" fill="#C23B33" />
        <rect y="6" width="20" height="1.2" fill="#C23B33" />
        <rect y="8.4" width="20" height="1.2" fill="#C23B33" />
        <rect y="10.8" width="20" height="1.2" fill="#C23B33" />
        <rect width="8.5" height="7.8" rx="2" fill="#24408E" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 20 14"
      className="h-3.5 w-5 rounded-[3px] shadow-sm"
      aria-hidden="true"
      data-testid="locale-flag-es"
    >
      <rect width="20" height="14" rx="2" fill="#F1C232" />
      <rect width="20" height="3" rx="2" fill="#B3332E" />
      <rect y="11" width="20" height="3" rx="2" fill="#B3332E" />
    </svg>
  )
}

export function LanguageSwitcher(): JSX.Element {
  const { t, i18n } = useTranslation('navigation')
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const currentLocale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language)

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handlePointerDown)
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  async function handleLanguageChange(locale: SupportedLocale): Promise<void> {
    setOpen(false)

    if (locale === currentLocale) {
      return
    }

    try {
      await window.api.preferences.setLanguage(locale)
      await i18n.changeLanguage(locale)
    } catch (error) {
      try {
        await window.api.preferences.setLanguage(currentLocale)
      } catch (rollbackError) {
        console.error('Failed to rollback language preference', rollbackError)
      }

      console.error('Failed to update language preference', error)
    }
  }

  function getLocaleLabel(locale: SupportedLocale): string {
    return t(`languageNames.${locale}`)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={t('language')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-xl border border-brand-sand/40 bg-white/80 px-3 text-sm font-medium text-brand-ink shadow-sm transition-colors',
          'hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky/25'
        )}
      >
        <span className="inline-flex min-w-6 justify-center">
          <LocaleFlag locale={currentLocale} />
        </span>
        <span className="hidden sm:inline">{getLocaleLabel(currentLocale)}</span>
        <ChevronDown className="h-4 w-4 text-secondary" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t('language')}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] min-w-52 rounded-2xl border border-brand-sand/45 bg-white p-2 shadow-[0_20px_44px_rgba(34,49,95,0.18)]"
        >
          {SUPPORTED_LOCALES.map((locale) => {
            const isActive = locale === currentLocale

            return (
              <button
                key={locale}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => void handleLanguageChange(locale)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-brand-sand/30 text-brand-ink'
                    : 'text-foreground hover:bg-brand-sand/18'
                )}
              >
                <span className="inline-flex min-w-6 justify-center">
                  <LocaleFlag locale={locale} />
                </span>
                <span className="flex-1">{getLocaleLabel(locale)}</span>
                {isActive ? <Check className="h-4 w-4 text-secondary" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
