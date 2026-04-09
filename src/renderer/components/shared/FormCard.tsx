import { Button } from '@renderer/components/ui/button'
import { useTranslation } from 'react-i18next'

interface FormCardProps {
  title: string
  description?: string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isLoading: boolean
  children: React.ReactNode
}

function FormCard({
  title,
  description,
  onSubmit,
  onCancel,
  isLoading,
  children,
}: FormCardProps): JSX.Element {
  const { t } = useTranslation('common')

  return (
    <div className="max-w-3xl rounded-[28px] border border-border/80 bg-white/84 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-6 border-b border-brand-sand/25 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
          {t('formSection')}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? t('formDescription')}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <div className="flex gap-3 pt-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('saving') : t('save')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export { FormCard }
