import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { formatCurrency, formatDate } from '@renderer/lib/format'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { FilterPanel } from '@renderer/components/shared/FilterPanel'
import { Button } from '@renderer/components/ui/button'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import type {
  CostFilters,
  ProjectCost,
  ProjectCostWithRelations,
  ProjectWithClient,
  SupportedLocale,
} from '../../../shared/types'

type CostCategory = ProjectCost['category']

export function CostsPage(): JSX.Element {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['costs', 'common'])
  const locale = i18n.language as SupportedLocale

  const [costs, setCosts] = useState<ProjectCostWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [filters, setFilters] = useState<CostFilters>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadCosts(activeFilters: CostFilters): Promise<void> {
    setIsLoading(true)
    try {
      const hasFilters = Object.values(activeFilters).some((v) => v !== undefined && v !== '')
      const data = await api.costs.list(hasFilters ? activeFilters : undefined)
      setCosts(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    api.projects.list().then(setProjects)
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

  const categoryOptions: { value: CostCategory; label: string }[] = [
    { value: 'fuel', label: t('costs:categories.fuel') },
    { value: 'labor', label: t('costs:categories.labor') },
    { value: 'maintenance', label: t('costs:categories.maintenance') },
    { value: 'transport', label: t('costs:categories.transport') },
    { value: 'outsourced', label: t('costs:categories.outsourced') },
    { value: 'miscellaneous', label: t('costs:categories.miscellaneous') },
  ]

  const hasActiveFilters =
    filters.projectId !== undefined ||
    filters.category !== undefined ||
    (filters.dateFrom !== undefined && filters.dateFrom !== '') ||
    (filters.dateTo !== undefined && filters.dateTo !== '')

  const columns = [
    {
      key: 'date',
      label: t('costs:columns.date'),
      render: (row: ProjectCostWithRelations) => formatDate(row.date, locale),
    },
    {
      key: 'projectName',
      label: t('costs:columns.project'),
      render: (row: ProjectCostWithRelations) => row.projectName ?? t('common:emptyValue'),
    },
    {
      key: 'category',
      label: t('costs:columns.category'),
      render: (row: ProjectCostWithRelations) =>
        t(`costs:categories.${row.category}`, { defaultValue: row.category }),
    },
    {
      key: 'description',
      label: t('costs:columns.description'),
      render: (row: ProjectCostWithRelations) => row.description,
    },
    {
      key: 'amount',
      label: t('costs:columns.amount'),
      render: (row: ProjectCostWithRelations) => formatCurrency(Number(row.amount), locale),
    },
    {
      key: 'machineName',
      label: t('costs:columns.machine'),
      render: (row: ProjectCostWithRelations) => row.machineName ?? t('common:emptyValue'),
    },
    {
      key: 'actions',
      label: t('costs:columns.actions'),
      render: (row: ProjectCostWithRelations) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/costs/${row.id}/edit`)}>
            {t('common:edit')}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteId(row.id)}>
            {t('common:delete')}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('costs:title')}
        action={{ label: t('costs:newAction'), onClick: () => navigate('/costs/new') }}
      />

      <FilterPanel>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('costs:filters.project')}</label>
          <Select
            value={filters.projectId !== undefined ? String(filters.projectId) : ''}
            onChange={(e) =>
              handleFilterChange({
                projectId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-56"
          >
            <option value="">{t('costs:filters.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('costs:filters.category')}</label>
          <Select
            value={filters.category ?? ''}
            onChange={(e) =>
              handleFilterChange({
                category: e.target.value ? (e.target.value as CostCategory) : undefined,
              })
            }
            className="w-48"
          >
            <option value="">{t('costs:filters.allCategories')}</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('costs:filters.dateFrom')}</label>
          <DatePicker
            value={filters.dateFrom ?? ''}
            onChange={(value) => handleFilterChange({ dateFrom: value || undefined })}
            className="w-40"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('costs:filters.dateTo')}</label>
          <DatePicker
            value={filters.dateTo ?? ''}
            onChange={(value) => handleFilterChange({ dateTo: value || undefined })}
            className="w-40"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            {t('costs:filters.clear')}
          </Button>
        )}
      </FilterPanel>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">{t('common:loading')}</div>
      ) : costs.length === 0 && !hasActiveFilters ? (
        <EmptyState
          message={t('costs:empty')}
          action={{
            label: t('costs:createFirst'),
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
        title={t('costs:deleteDialog.title')}
        description={t('costs:deleteDialog.description')}
      />
    </div>
  )
}
