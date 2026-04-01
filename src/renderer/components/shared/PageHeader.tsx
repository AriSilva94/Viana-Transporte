import { Button } from '@renderer/components/ui/button'

interface ActionConfig {
  label: string
  onClick: () => void
}

interface PageHeaderProps {
  title: string
  action?: ActionConfig
}

function PageHeader({ title, action }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}

export { PageHeader }
