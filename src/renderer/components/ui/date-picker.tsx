import * as React from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@renderer/lib/utils'

interface DatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  allowClear?: boolean
}

function parseDate(value: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function formatDate(value: string, locale: string): string {
  const date = parseDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarDays(month: Date): Date[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const startOffset = firstDay.getDay()
  const startDate = new Date(year, monthIndex, 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    return date
  })
}

function isSameDay(a: Date | null, b: Date): boolean {
  if (!a) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  allowClear = false,
}: DatePickerProps): JSX.Element {
  const { t, i18n } = useTranslation('common')
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const selectedDate = parseDate(value)
  const [open, setOpen] = React.useState(false)
  const [visibleMonth, setVisibleMonth] = React.useState<Date>(() => selectedDate ?? new Date())
  const locale = i18n.resolvedLanguage ?? i18n.language
  const translatedWeekDays = t('weekDays', { returnObjects: true })
  const weekDays = Array.isArray(translatedWeekDays) ? translatedWeekDays : []
  const inputPlaceholder = placeholder ?? t('selectDate')

  React.useEffect(() => {
    const nextSelectedDate = parseDate(value)

    if (nextSelectedDate && !isSameMonth(visibleMonth, nextSelectedDate)) {
      setVisibleMonth(nextSelectedDate)
    }
  }, [value])

  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [open])

  const today = new Date()
  const days = getCalendarDays(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth)

  function handleSelect(date: Date): void {
    onChange(toIsoDate(date))
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border border-input bg-white/85 px-3 py-2 text-left text-sm text-foreground shadow-sm transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'border-secondary/45 ring-2 ring-brand-sky/18'
        )}
      >
        <span className={cn('truncate whitespace-nowrap pr-3', !value && 'text-muted-foreground')}>
          {value ? formatDate(value, locale) : inputPlaceholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-secondary" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[284px] rounded-[22px] border border-brand-sand/45 bg-[#fffaf4] p-3.5 shadow-[0_20px_44px_rgba(34,49,95,0.18)]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="rounded-xl border border-brand-sand/40 bg-white px-2.5 py-2 text-brand-ink transition-colors hover:bg-brand-sand/18"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">{t('calendar')}</p>
              <p className="mt-1 text-sm font-semibold capitalize leading-none text-foreground">{monthLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="rounded-xl border border-brand-sand/40 bg-white px-2.5 py-2 text-brand-ink transition-colors hover:bg-brand-sand/18"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {weekDays.map((day, index) => (
              <span
                key={`${day}-${index}`}
                className="py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {day}
              </span>
            ))}
            {days.map((day) => {
              const isSelected = isSameDay(selectedDate, day)
              const isCurrentMonth = isSameMonth(day, visibleMonth)
              const isToday = isSameDay(today, day)

              return (
                <button
                  key={toIsoDate(day)}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={cn(
                    'flex h-8 items-center justify-center rounded-lg text-sm font-medium transition-all duration-150',
                    isSelected && 'bg-brand-deep text-white shadow-sm',
                    !isSelected && isCurrentMonth && 'text-foreground hover:bg-brand-sand/20',
                    !isSelected && !isCurrentMonth && 'text-muted-foreground/55 hover:bg-brand-sand/10',
                    isToday && !isSelected && 'border border-brand-orange/35 bg-brand-orange/8 text-brand-orange'
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-brand-sand/25 pt-3">
            <button
              type="button"
              onClick={() => {
                setVisibleMonth(today)
                handleSelect(today)
              }}
              className="text-sm font-medium text-secondary transition-colors hover:text-primary"
            >
              {t('today')}
            </button>
            <div className="flex items-center gap-2">
              {allowClear ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                  }}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('clear')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-brand-sand/28 px-3 py-1.5 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-sand/40"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { DatePicker }
