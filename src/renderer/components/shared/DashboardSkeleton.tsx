import { Skeleton } from '@renderer/components/ui/skeleton'

function DashboardSkeleton(): JSX.Element {
  return (
    <div className="space-y-6">
      {/* banner hero */}
      <Skeleton className="h-[106px] rounded-[28px]" />

      {/* grid 4 metric cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[112px] rounded-3xl" />
        ))}
      </div>

      {/* grid 3 metric cards financeiros */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[112px] rounded-3xl" />
        ))}
      </div>

      {/* 2 SectionCards */}
      {Array.from({ length: 2 }).map((_, sectionIdx) => (
        <div
          key={sectionIdx}
          className="rounded-[28px] border border-border/80 bg-white/82 p-5 shadow-sm backdrop-blur-sm"
        >
          <div className="mb-4 border-b border-brand-sand/25 pb-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-48" />
          </div>
          {/* 5 linhas de tabela */}
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex gap-4 border-b border-border/70 py-3 last:border-0">
              {Array.from({ length: 5 }).map((_, colIdx) => (
                <Skeleton key={colIdx} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export { DashboardSkeleton }
