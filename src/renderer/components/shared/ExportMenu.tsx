import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'

interface ExportMenuProps {
  onExportExcel: () => Promise<void>
  onExportPdf: () => Promise<void>
  disabled?: boolean
}

export function ExportMenu({ onExportExcel, onExportPdf, disabled }: ExportMenuProps): JSX.Element {
  const { t } = useTranslation(['reports'])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

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
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        onClick={() => setOpen((v) => !v)}
      >
        {loading ? t('reports:export.loading') : t('reports:export.button')}
      </Button>
      {open && !disabled && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-md border bg-popover shadow-md">
          <button
            className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent"
            onClick={() => handle(onExportExcel)}
          >
            {t('reports:export.excel')}
          </button>
          <button
            className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent"
            onClick={() => handle(onExportPdf)}
          >
            {t('reports:export.pdf')}
          </button>
        </div>
      )}
    </div>
  )
}
