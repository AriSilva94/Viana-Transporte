import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Select } from '@renderer/components/ui/select'
import type { DailyLogWithRelations, ProjectWithClient, DailyLogFilters } from '../../../shared/types'

export function DailyLogsPage(): JSX.Element {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [filters, setFilters] = useState<DailyLogFilters>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function loadLogs(activeFilters: DailyLogFilters): Promise<void> {
    const hasFilters = Object.values(activeFilters).some((v) => v !== undefined && v !== '')
    const data = await api.dailylogs.list(hasFilters ? activeFilters : undefined)
    setLogs(data)
  }

  useEffect(() => {
    api.projects.list().then(setProjects)
    loadLogs({})
  }, [])

  useEffect(() => {
    loadLogs(filters)
  }, [filters])

  function handleFilterChange(patch: Partial<DailyLogFilters>): void {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function clearFilters(): void {
    setFilters({})
  }

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.dailylogs.delete(deleteId)
    setDeleteId(null)
    loadLogs(filters)
  }

  const hasActiveFilters =
    filters.projectId !== undefined ||
    (filters.dateFrom !== undefined && filters.dateFrom !== '') ||
    (filters.dateTo !== undefined && filters.dateTo !== '')

  const columns = [
    {
      key: 'date',
      label: 'Data',
      render: (row: DailyLogWithRelations) =>
        new Date(row.date).toLocaleDateString('pt-BR'),
    },
    {
      key: 'projectName',
      label: 'Projeto',
      render: (row: DailyLogWithRelations) => row.projectName ?? '—',
    },
    {
      key: 'machineName',
      label: 'Máquina',
      render: (row: DailyLogWithRelations) => row.machineName ?? '—',
    },
    {
      key: 'operatorName',
      label: 'Operador',
      render: (row: DailyLogWithRelations) => row.operatorName ?? '—',
    },
    {
      key: 'hoursWorked',
      label: 'Horas',
      render: (row: DailyLogWithRelations) => String(row.hoursWorked),
    },
    {
      key: 'fuelQuantity',
      label: 'Combustível',
      render: (row: DailyLogWithRelations) =>
        row.fuelQuantity != null ? String(row.fuelQuantity) : '—',
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (row: DailyLogWithRelations) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/daily-logs/${row.id}/edit`)}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteId(row.id)}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Diários de Operação"
        action={{ label: 'Novo Registro', onClick: () => navigate('/daily-logs/new') }}
      />

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Projeto</label>
          <Select
            value={filters.projectId !== undefined ? String(filters.projectId) : ''}
            onChange={(e) =>
              handleFilterChange({
                projectId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-56"
          >
            <option value="">Todos os projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Data inicial</label>
          <Input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) =>
              handleFilterChange({ dateFrom: e.target.value || undefined })
            }
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Data final</label>
          <Input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) =>
              handleFilterChange({ dateTo: e.target.value || undefined })
            }
            className="w-40"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      {logs.length === 0 && !hasActiveFilters ? (
        <EmptyState
          message="Nenhum diário de operação registrado"
          action={{
            label: 'Criar primeiro registro',
            onClick: () => navigate('/daily-logs/new'),
          }}
        />
      ) : (
        <DataTable columns={columns} data={logs} />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Excluir Registro"
        description="Tem certeza que deseja excluir este diário? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
