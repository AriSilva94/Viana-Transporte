import { useTranslation } from 'react-i18next'
import { cn } from '@renderer/lib/utils'
import logo from '@renderer/assets/img/logo.png'

interface AuthCardProps {
  title: string
  titleTestId?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

function AuthCard({ title, titleTestId, description, children, footer, className }: AuthCardProps): JSX.Element {
  const { t } = useTranslation('auth')

  return (
    <section
      className={cn(
        'w-full max-w-[480px] rounded-[32px] border border-border/80 bg-white/88 p-8 shadow-[0_24px_80px_rgba(34,49,95,0.18)] backdrop-blur-sm',
        className
      )}
    >
      <div className="mb-6 border-b border-brand-sand/25 pb-5">
        <div className="mb-4 flex flex-col items-center gap-3">
          <img src={logo} alt="Viana Transporte" className="h-24 w-24 object-contain" />
          <p className="text-xl font-bold tracking-wide text-brand-ink">{t('brand')}</p>
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-foreground" data-testid={titleTestId}>
          {title}
        </h1>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
      {footer ? (
        <div className="mt-6 border-t border-brand-sand/25 pt-5" data-testid="auth-footer">
          {footer}
        </div>
      ) : null}
    </section>
  )
}

export { AuthCard }
