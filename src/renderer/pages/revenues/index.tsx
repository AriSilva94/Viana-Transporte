import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { FilterPanel } from '@renderer/components/shared/FilterPanel'
import { StatusBadge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import type { ProjectRevenueWithRelations, ProjectWithClient, RevenueFilters, ProjectRevenue } from '../../../shared/types'

type RevenueStatus = ProjectRevenue['status']

const STATUS_OPTIONS: { value: RevenueStatus; label: string }[] = [
  { value: 'planned', label: 'Previsto' },
  { value: 'billed', label: 'Faturado' },
  { value: 'received', label: 'Recebido' },
]

export function RevenuesPage(): JSX.Element {
  const navigate = useNavigate()
  const [revenues, setRevenues] = useState<ProjectRevenueWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [filters, setFilters] = useState<RevenueFilters>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadRevenues(activeFilters: RevenueFilters): Promise<void> {
    setIsLoading(true)
    try {
      const hasFilters = Object.values(activeFilters).some((v) => v !== undefined && v !== '')
      const data = await api.revenues.list(hasFilters ? activeFilters : undefined)
      setRevenues(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    api.projects.list().then(setProjects)
    loadRevenues({})
  }, [])

  useEffect(() => {
    loadRevenues(filters)
  }, [filters])

  function handleFilterChange(patch: Partial<RevenueFilters>): void {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function clearFilters(): void {
    setFilters({})
  }

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.revenues.delete(deleteId)
    setDeleteId(null)
    loadRevenues(filters)
  }

  const hasActiveFilters =
    filters.projectId !== undefined ||
    filters.status !== undefined ||
    (filters.dateFrom !== undefined && filters.dateFrom !== '') ||
    (filters.dateTo !== undefined && filters.dateTo !== '')

  const columns = [
    {
      key: 'date',
      label: 'Data',
      render: (row: ProjectRevenueWithRelations) =>
        new Date(row.date).toLocaleDateString('pt-BR'),
    },
    {
      key: 'projectName',
      label: 'Projeto',
      render: (row: ProjectRevenueWithRelations) => row.projectName ?? '—',
    },
    {
      key: 'description',
      label: 'Descrição',
      render: (row: ProjectRevenueWithRelations) => row.description,
    },
    {
      key: 'amount',
      label: 'Valor',
      render: (row: ProjectRevenueWithRelations) =>
        `R$ ${Number(row.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: ProjectRevenueWithRelations) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (row: ProjectRevenueWithRelations) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/revenues/${row.id}/edit`)}
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
        title="Receitas / Medições"
        action={{ label: 'Nova Receita', onClick: () => navigate('/revenues/new') }}
      />

      <FilterPanel>
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
          <label className="text-sm font-medium text-foreground">Status</label>
          <Select
            value={filters.status ?? ''}
            onChange={(e) =>
              handleFilterChange({
                status: e.target.value ? (e.target.value as RevenueStatus) : undefined,
              })
            }
            className="w-48"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Data inicial</label>
          <DatePicker
            value={filters.dateFrom ?? ''}
            onChange={(value) => handleFilterChange({ dateFrom: value || undefined })}
            className="w-40"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Data final</label>
          <DatePicker
            value={filters.dateTo ?? ''}
            onChange={(value) => handleFilterChange({ dateTo: value || undefined })}
            className="w-40"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </FilterPanel>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Carregando...</div>
      ) : revenues.length === 0 && !hasActiveFilters ? (
        <EmptyState
          message="Nenhuma receita registrada"
          action={{
            label: 'Registrar primeira receita',
            onClick: () => navigate('/revenues/new'),
          }}
        />
      ) : (
        <DataTable columns={columns} data={revenues} />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Excluir Receita"
        description="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
