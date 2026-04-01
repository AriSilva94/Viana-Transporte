import * as React from 'react'
import { cn } from '@renderer/lib/utils'

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  canceled: 'bg-red-100 text-red-800',
  available: 'bg-green-100 text-green-800',
  allocated: 'bg-yellow-100 text-yellow-800',
  under_maintenance: 'bg-orange-100 text-orange-800',
  inactive: 'bg-gray-100 text-gray-800',
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
}

interface StatusBadgeProps {
  status: string
  className?: string
}

function StatusBadge({ status, className }: StatusBadgeProps): JSX.Element {
  const colorClass = statusColors[status] ?? 'bg-gray-100 text-gray-800'
  const label = statusLabels[status] ?? status
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}

export { StatusBadge, statusLabels }
