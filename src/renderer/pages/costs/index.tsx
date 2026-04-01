import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { FilterPanel } from '@renderer/components/shared/FilterPanel'
import { Button } from '@renderer/components/ui/button'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import type { ProjectCostWithRelations, ProjectWithClient, CostFilters, ProjectCost } from '../../../shared/types'

type CostCategory = ProjectCost['category']

const CATEGORY_LABELS: Record<CostCategory, string> = {
  fuel: 'Combustível',
  labor: 'Mão de obra',
  maintenance: 'Manutenção',
  transport: 'Transporte',
  outsourced: 'Serviço terceirizado',
  miscellaneous: 'Diversos',
}

const CATEGORY_OPTIONS: { value: CostCategory; label: string }[] = [
  { value: 'fuel', label: 'Combustível' },
  { value: 'labor', label: 'Mão de obra' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'transport', label: 'Transporte' },
  { value: 'outsourced', label: 'Serviço terceirizado' },
  { value: 'miscellaneous', label: 'Diversos' },
]

export function CostsPage(): JSX.Element {
  const navigate = useNavigate()
  const [costs, setCosts] = useState<ProjectCostWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [filters, setFilters] = useState<CostFilters>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function loadCosts(activeFilters: CostFilters): Promise<void> {
    const hasFilters = Object.values(activeFilters).some((v) => v !== undefined && v !== '')
    const data = await api.costs.list(hasFilters ? activeFilters : undefined)
    setCosts(data)
  }

  useEffect(() => {
    api.projects.list().then(setProjects)
    loadCosts({})
  }, [])

  useEffect(() => {
    loadCosts(filters)
  }, [filters])

  function handleFilterChange(patch: Partial<CostFilters>): void {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function clearFilters(): void {
    setFilters({})
  }

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.costs.delete(deleteId)
    setDeleteId(null)
    loadCosts(filters)
  }

  const hasActiveFilters =
    filters.projectId !== undefined ||
    filters.category !== undefined ||
    (filters.dateFrom !== undefined && filters.dateFrom !== '') ||
    (filters.dateTo !== undefined && filters.dateTo !== '')

  const columns = [
    {
      key: 'date',
      label: 'Data',
      render: (row: ProjectCostWithRelations) =>
        new Date(row.date).toLocaleDateString('pt-BR'),
    },
    {
      key: 'projectName',
      label: 'Projeto',
      render: (row: ProjectCostWithRelations) => row.projectName ?? '—',
    },
    {
      key: 'category',
      label: 'Categoria',
      render: (row: ProjectCostWithRelations) => CATEGORY_LABELS[row.category] ?? row.category,
    },
    {
      key: 'description',
      label: 'Descrição',
      render: (row: ProjectCostWithRelations) => row.description,
    },
    {
      key: 'amount',
      label: 'Valor',
      render: (row: ProjectCostWithRelations) =>
        `R$ ${Number(row.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'machineName',
      label: 'Máquina',
      render: (row: ProjectCostWithRelations) => row.machineName ?? '—',
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (row: ProjectCostWithRelations) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/costs/${row.id}/edit`)}
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
        title="Custos"
        action={{ label: 'Novo Custo', onClick: () => navigate('/costs/new') }}
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
          <label className="text-sm font-medium text-foreground">Categoria</label>
          <Select
            value={filters.category ?? ''}
            onChange={(e) =>
              handleFilterChange({
                category: e.target.value ? (e.target.value as CostCategory) : undefined,
              })
            }
            className="w-48"
          >
            <option value="">Todas as categorias</option>
            {CATEGORY_OPTIONS.map((opt) => (
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

      {costs.length === 0 && !hasActiveFilters ? (
        <EmptyState
          message="Nenhum custo registrado"
          action={{
            label: 'Registrar primeiro custo',
            onClick: () => navigate('/costs/new'),
          }}
        />
      ) : (
        <DataTable columns={columns} data={costs} />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Excluir Custo"
        description="Tem certeza que deseja excluir este custo? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
