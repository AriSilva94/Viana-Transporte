import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { formatDate, formatDecimal } from '@renderer/lib/format'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { FilterPanel } from '@renderer/components/shared/FilterPanel'
import { Button } from '@renderer/components/ui/button'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import type {
  DailyLogFilters,
  DailyLogWithRelations,
  Machine,
  Operator,
  ProjectWithClient,
  SupportedLocale,
} from '../../../shared/types'

export function DailyLogsPage(): JSX.Element {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['dailylogs', 'common'])
  const locale = i18n.language as SupportedLocale

  const [logs, setLogs] = useState<DailyLogWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [filters, setFilters] = useState<DailyLogFilters>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadLogs(activeFilters: DailyLogFilters): Promise<void> {
    setIsLoading(true)
    try {
      const hasFilters = Object.values(activeFilters).some((v) => v !== undefined && v !== '')
      const data = await api.dailylogs.list(hasFilters ? activeFilters : undefined)
      setLogs(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    api.projects.list().then(setProjects)
    api.machines.list().then(setMachines)
    api.operators.list().then(setOperators)
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
    filters.machineId !== undefined ||
    filters.operatorId !== undefined ||
    (filters.dateFrom !== undefined && filters.dateFrom !== '') ||
    (filters.dateTo !== undefined && filters.dateTo !== '')

  const columns = [
    {
      key: 'date',
      label: t('dailylogs:columns.date'),
      render: (row: DailyLogWithRelations) => formatDate(row.date, locale),
    },
    {
      key: 'projectName',
      label: t('dailylogs:columns.project'),
      render: (row: DailyLogWithRelations) => row.projectName ?? t('common:emptyValue'),
    },
    {
      key: 'machineName',
      label: t('dailylogs:columns.machine'),
      render: (row: DailyLogWithRelations) => row.machineName ?? t('common:emptyValue'),
    },
    {
      key: 'operatorName',
      label: t('dailylogs:columns.operator'),
      render: (row: DailyLogWithRelations) => row.operatorName ?? t('common:emptyValue'),
    },
    {
      key: 'hoursWorked',
      label: t('dailylogs:columns.hoursWorked'),
      render: (row: DailyLogWithRelations) => formatDecimal(Number(row.hoursWorked), locale),
    },
    {
      key: 'fuelQuantity',
      label: t('dailylogs:columns.fuelQuantity'),
      render: (row: DailyLogWithRelations) =>
        row.fuelQuantity != null
          ? formatDecimal(Number(row.fuelQuantity), locale)
          : t('common:emptyValue'),
    },
    {
      key: 'actions',
      label: t('dailylogs:columns.actions'),
      render: (row: DailyLogWithRelations) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/daily-logs/${row.id}/edit`)}>
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
        title={t('dailylogs:title')}
        action={{ label: t('dailylogs:newAction'), onClick: () => navigate('/daily-logs/new') }}
      />

      <FilterPanel>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('dailylogs:filters.project')}</label>
          <Select
            value={filters.projectId !== undefined ? String(filters.projectId) : ''}
            onChange={(e) =>
              handleFilterChange({
                projectId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-56"
          >
            <option value="">{t('dailylogs:filters.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('dailylogs:filters.machine')}</label>
          <Select
            value={filters.machineId !== undefined ? String(filters.machineId) : ''}
            onChange={(e) =>
              handleFilterChange({
                machineId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-48"
          >
            <option value="">{t('dailylogs:filters.allMachines')}</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('dailylogs:filters.operator')}</label>
          <Select
            value={filters.operatorId !== undefined ? String(filters.operatorId) : ''}
            onChange={(e) =>
              handleFilterChange({
                operatorId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-48"
          >
            <option value="">{t('dailylogs:filters.allOperators')}</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('dailylogs:filters.dateFrom')}</label>
          <DatePicker
            value={filters.dateFrom ?? ''}
            onChange={(value) => handleFilterChange({ dateFrom: value || undefined })}
            className="w-40"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('dailylogs:filters.dateTo')}</label>
          <DatePicker
            value={filters.dateTo ?? ''}
            onChange={(value) => handleFilterChange({ dateTo: value || undefined })}
            className="w-40"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            {t('dailylogs:filters.clear')}
          </Button>
        )}
      </FilterPanel>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">{t('common:loading')}</div>
      ) : logs.length === 0 && !hasActiveFilters ? (
        <EmptyState
          message={t('dailylogs:empty')}
          action={{
            label: t('dailylogs:createFirst'),
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
        title={t('dailylogs:deleteDialog.title')}
        description={t('dailylogs:deleteDialog.description')}
      />
    </div>
  )
}
