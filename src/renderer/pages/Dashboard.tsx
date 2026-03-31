import { Button } from '@renderer/components/ui/button'

export function Dashboard(): JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <p className="text-muted-foreground mb-4">Visão geral do negócio.</p>
      <Button>Componente shadcn/ui funcionando</Button>
    </div>
  )
}
