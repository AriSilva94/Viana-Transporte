import { cn } from '@renderer/lib/utils'

interface SurfaceSectionProps {
  eyebrow?: string
  title?: string
  description?: string
  className?: string
  contentClassName?: string
  children: React.ReactNode
}

function SurfaceSection({
  eyebrow,
  title,
  description,
  className,
  contentClassName,
  children,
}: SurfaceSectionProps): JSX.Element {
  const hasHeader = Boolean(eyebrow || title || description)

  return (
    <section
      className={cn(
        'rounded-[28px] border border-border/80 bg-white/82 p-5 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      {hasHeader ? (
        <div className="mb-4 border-b border-brand-sand/25 pb-4">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
              {eyebrow}
            </p>
          ) : null}
          {title ? <h2 className="mt-2 text-xl font-semibold text-foreground">{title}</h2> : null}
          {description ? (
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className={cn(contentClassName)}>{children}</div>
    </section>
  )
}

export { SurfaceSection }
