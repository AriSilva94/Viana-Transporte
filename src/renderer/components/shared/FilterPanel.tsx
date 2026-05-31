import { cn } from '@renderer/lib/utils'

interface FilterPanelProps {
  className?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

function FilterPanel({ className, children, actions }: FilterPanelProps): JSX.Element {
  return (
    <div
      className={cn(
        'relative z-10 mb-5 rounded-3xl border border-border/80 bg-white/78 p-4 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-end gap-4">
        <div className="flex flex-1 flex-wrap items-end gap-4">{children}</div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  )
}

export { FilterPanel }
