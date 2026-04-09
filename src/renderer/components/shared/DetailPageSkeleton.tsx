import { Skeleton } from '@renderer/components/ui/skeleton'

function DetailPageSkeleton(): JSX.Element {
  return (
    <div className="space-y-6">
      {/* PageHeader skeleton */}
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>

      {/* SurfaceSection skeleton */}
      <div className="rounded-[28px] border border-border/80 bg-white/84 p-5 shadow-sm backdrop-blur-sm">
        {/* eyebrow + title */}
        <div className="mb-4 border-b border-brand-sand/25 pb-4 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>

        {/* grid de 4 campos */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted/20 p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { DetailPageSkeleton }
