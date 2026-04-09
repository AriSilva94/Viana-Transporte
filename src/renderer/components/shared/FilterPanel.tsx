import { cn } from '@renderer/lib/utils'

interface FilterPanelProps {
  className?: string
  children: React.ReactNode
}

function FilterPanel({ className, children }: FilterPanelProps): JSX.Element {
  return (
    <div
      className={cn(
        'mb-5 rounded-3xl border border-border/80 bg-white/78 p-4 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-end gap-4">{children}</div>
    </div>
  )
}

export { FilterPanel }
