import { cn } from '@renderer/lib/utils'

interface AuthCardProps {
  title: string
  titleTestId?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

function AuthCard({
  title,
  titleTestId,
  description,
  children,
  footer,
  className,
}: AuthCardProps): JSX.Element {
  return (
    <section className={cn('w-full max-w-sm', className)}>
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold tracking-tight text-brand-ink xl:text-4xl"
          data-testid={titleTestId}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="mt-8 border-t border-border/60 pt-5" data-testid="auth-footer">
          {footer}
        </div>
      ) : null}
    </section>
  )
}

export { AuthCard }
