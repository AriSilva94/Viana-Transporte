import { Button } from '@renderer/components/ui/button'

interface FormCardProps {
  title: string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isLoading: boolean
  children: React.ReactNode
}

function FormCard({
  title,
  onSubmit,
  onCancel,
  isLoading,
  children,
}: FormCardProps): JSX.Element {
  return (
    <div className="rounded-lg border bg-card p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

export { FormCard }
