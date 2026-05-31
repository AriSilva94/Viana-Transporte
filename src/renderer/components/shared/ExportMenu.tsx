import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@renderer/lib/utils'

interface ExportMenuProps {
  onExportExcel: () => Promise<void>
  onExportPdf: () => Promise<void>
  disabled?: boolean
}

export function ExportMenu({ onExportExcel, onExportPdf, disabled }: ExportMenuProps): JSX.Element {
  const { t } = useTranslation(['reports'])
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [dropdownPos, setDropdownPos] = React.useState<{ top: number; right: number } | null>(null)

  function openDropdown(): void {
    const btn = buttonRef.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen(true)
  }

  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      const target = event.target as Node
      if (!buttonRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  async function handle(fn: () => Promise<void>): Promise<void> {
    setOpen(false)
    setLoading(true)
    try {
      await fn()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || loading}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white/80 px-3 text-sm font-medium text-foreground shadow-sm transition-all duration-200',
          'hover:border-secondary/40 hover:bg-brand-sand/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'border-secondary/45 ring-2 ring-brand-sky/18'
        )}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : (
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span>{loading ? t('reports:export.loading') : t('reports:export.button')}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && dropdownPos
        ? ReactDOM.createPortal(
            <div
              ref={dropdownRef}
              style={{ top: dropdownPos.top, right: dropdownPos.right, position: 'fixed' }}
              role="menu"
              className="z-[9999] min-w-[11rem] overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(34,49,95,0.14)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => handle(onExportExcel)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-brand-sand/15"
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-600" />
                {t('reports:export.excel')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handle(onExportPdf)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-brand-sand/15"
              >
                <FileText className="h-4 w-4 shrink-0 text-red-500" />
                {t('reports:export.pdf')}
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
