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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground mb-4">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
