import { Button } from '@renderer/components/ui/button'
import { useTranslation } from 'react-i18next'

interface ActionConfig {
  label: string
  onClick: () => void
}

interface PageHeaderProps {
  title: string
  action?: ActionConfig
}

function PageHeader({ title, action }: PageHeaderProps): JSX.Element {
  const { t } = useTranslation('common')

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-border/80 bg-white/75 px-5 py-4 shadow-sm backdrop-blur-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">{t('panel')}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{title}</h1>
      </div>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}

export { PageHeader }
