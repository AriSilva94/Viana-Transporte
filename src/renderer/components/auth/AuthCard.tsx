import { useTranslation } from 'react-i18next'
import { cn } from '@renderer/lib/utils'

interface AuthCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

function AuthCard({ title, description, children, className }: AuthCardProps): JSX.Element {
  const { t } = useTranslation('auth')

  return (
    <section
      className={cn(
        'w-full max-w-[480px] rounded-[32px] border border-border/80 bg-white/88 p-8 shadow-[0_24px_80px_rgba(34,49,95,0.18)] backdrop-blur-sm',
        className
      )}
    >
      <div className="mb-6 border-b border-brand-sand/25 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">{t('brand')}</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">{title}</h1>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

export { AuthCard }
