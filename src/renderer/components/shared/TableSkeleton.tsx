import { Skeleton } from '@renderer/components/ui/skeleton'

interface TableSkeletonProps {
  columns?: number
}

function TableSkeleton({ columns = 4 }: TableSkeletonProps): JSX.Element {
  return (
    <div className="space-y-4">
      {/* input de busca fantasma */}
      <Skeleton className="h-9 max-w-sm" />

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white/80 shadow-sm backdrop-blur-sm">
        {/* header */}
        <div className="flex gap-4 border-b bg-brand-sand/18 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>

        {/* 5 linhas */}
        {Array.from({ length: 5 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex gap-4 border-b border-border/70 px-4 py-3 last:border-0"
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export { TableSkeleton }
