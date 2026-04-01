import * as React from 'react'
import { cn } from '@renderer/lib/utils'

const statusColors: Record<string, string> = {
  planned: 'bg-brand-sand/25 text-brand-ink',
  active: 'bg-brand-deep text-white',
  completed: 'bg-brand-sky/18 text-brand-deep',
  canceled: 'bg-brand-orange/18 text-brand-orange',
  available: 'bg-brand-sky/18 text-brand-deep',
  allocated: 'bg-brand-sand/35 text-brand-ink',
  under_maintenance: 'bg-brand-orange/18 text-brand-orange',
  inactive: 'bg-muted text-muted-foreground',
  billed: 'bg-brand-sand/35 text-brand-ink',
  received: 'bg-brand-deep/12 text-brand-deep',
}

const statusLabels: Record<string, string> = {
  planned: 'Planejado',
  active: 'Ativo',
  completed: 'Concluído',
  canceled: 'Cancelado',
  available: 'Disponível',
  allocated: 'Alocado',
  under_maintenance: 'Em Manutenção',
  inactive: 'Inativo',
  billed: 'Faturado',
  received: 'Recebido',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

function StatusBadge({ status, className }: StatusBadgeProps): JSX.Element {
  const colorClass = statusColors[status] ?? 'bg-muted text-muted-foreground'
  const label = statusLabels[status] ?? status
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-black/5 px-2.5 py-1 text-xs font-medium shadow-sm',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}

export { StatusBadge, statusLabels }
