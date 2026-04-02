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
import { StatusBadge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import type {
  ProjectRevenue,
  ProjectRevenueWithRelations,
  ProjectWithClient,
  RevenueFilters,
  SupportedLocale,
} from '../../../shared/types'

type RevenueStatus = ProjectRevenue['status']

export function RevenuesPage(): JSX.Element {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['revenues', 'common'])
  const locale = i18n.language as SupportedLocale

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

  const statusOptions: { value: RevenueStatus; label: string }[] = [
    { value: 'planned', label: t('revenues:statuses.planned') },
    { value: 'billed', label: t('revenues:statuses.billed') },
    { value: 'received', label: t('revenues:statuses.received') },
  ]

  const hasActiveFilters =
    filters.projectId !== undefined ||
    filters.status !== undefined ||
    (filters.dateFrom !== undefined && filters.dateFrom !== '') ||
    (filters.dateTo !== undefined && filters.dateTo !== '')

  const columns = [
    {
      key: 'date',
      label: t('revenues:columns.date'),
      render: (row: ProjectRevenueWithRelations) => formatDate(row.date, locale),
    },
    {
      key: 'projectName',
      label: t('revenues:columns.project'),
      render: (row: ProjectRevenueWithRelations) => row.projectName ?? t('common:emptyValue'),
    },
    {
      key: 'description',
      label: t('revenues:columns.description'),
      render: (row: ProjectRevenueWithRelations) => row.description,
    },
    {
      key: 'amount',
      label: t('revenues:columns.amount'),
      render: (row: ProjectRevenueWithRelations) => formatCurrency(Number(row.amount), locale),
    },
    {
      key: 'status',
      label: t('revenues:columns.status'),
      render: (row: ProjectRevenueWithRelations) => (
        <StatusBadge status={row.status} namespace="revenues" labelKeyPrefix="statuses" />
      ),
    },
    {
      key: 'actions',
      label: t('revenues:columns.actions'),
      render: (row: ProjectRevenueWithRelations) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/revenues/${row.id}/edit`)}>
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
        title={t('revenues:title')}
        action={{ label: t('revenues:newAction'), onClick: () => navigate('/revenues/new') }}
      />

      <FilterPanel>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('revenues:filters.project')}</label>
          <Select
            value={filters.projectId !== undefined ? String(filters.projectId) : ''}
            onChange={(e) =>
              handleFilterChange({
                projectId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-56"
          >
            <option value="">{t('revenues:filters.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('revenues:filters.status')}</label>
          <Select
            value={filters.status ?? ''}
            onChange={(e) =>
              handleFilterChange({
                status: e.target.value ? (e.target.value as RevenueStatus) : undefined,
              })
            }
            className="w-48"
          >
            <option value="">{t('revenues:filters.allStatuses')}</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('revenues:filters.dateFrom')}</label>
          <DatePicker
            value={filters.dateFrom ?? ''}
            onChange={(value) => handleFilterChange({ dateFrom: value || undefined })}
            className="w-40"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('revenues:filters.dateTo')}</label>
          <DatePicker
            value={filters.dateTo ?? ''}
            onChange={(value) => handleFilterChange({ dateTo: value || undefined })}
            className="w-40"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            {t('revenues:filters.clear')}
          </Button>
        )}
      </FilterPanel>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">{t('common:loading')}</div>
      ) : revenues.length === 0 && !hasActiveFilters ? (
        <EmptyState
          message={t('revenues:empty')}
          action={{
            label: t('revenues:createFirst'),
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
        title={t('revenues:deleteDialog.title')}
        description={t('revenues:deleteDialog.description')}
      />
    </div>
  )
}
