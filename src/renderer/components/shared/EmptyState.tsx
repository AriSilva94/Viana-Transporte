import { Button } from '@renderer/components/ui/button'

interface ActionConfig {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  message: string
  action?: ActionConfig
}

function EmptyState({ message, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-sky/30 bg-white/60 px-6 py-16 text-center shadow-sm backdrop-blur-sm">
      <p className="mb-4 max-w-md text-muted-foreground">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
