import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { formatCurrency, formatDate, formatDecimal } from '@renderer/lib/format'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { TableSkeleton } from '@renderer/components/shared/TableSkeleton'
import { DataTable } from '@renderer/components/shared/DataTable'
import { FilterPanel } from '@renderer/components/shared/FilterPanel'
import { StatusBadge } from '@renderer/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { Select } from '@renderer/components/ui/select'
import { Button } from '@renderer/components/ui/button'
import { DatePicker } from '@renderer/components/ui/date-picker'
import { endOfLocalDay, isLocalDateWithinInclusiveRange, parseLocalDate } from '../../../shared/date'
import type {
  ProjectWithClient,
  Machine,
  DailyLogWithRelations,
  ProjectCostWithRelations,
  ProjectRevenueWithRelations,
  Project,
  ProjectCost,
  DailyLogFilters,
  CostFilters,
  SupportedLocale,
} from '../../../shared/types'

const reportCardClass = 'rounded-3xl border border-border/80 bg-white/82 p-4 shadow-sm backdrop-blur-sm'

type CostCategory = ProjectCost['category']

interface ProjectSummaryRow {
  id: number
  name: string
  clientName: string | null
  status: Project['status']
  totalHours: number
  totalCosts: number
  totalRevenues: number
  profit: number
}

interface ProjectSummaryFilters {
  status: Project['status'] | ''
  dateFrom: string
  dateTo: string
}

interface MachineUsageRow {
  id: number
  name: string
  type: string
  totalHours: number
  logCount: number
}

interface CategorySummaryRow {
  category: CostCategory
  label: string
  total: number
  count: number
}

function ProjectSummaryTab(): JSX.Element {
  const { t, i18n } = useTranslation(['reports', 'common'])
  const locale = i18n.language as SupportedLocale
  const [rows, setRows] = useState<ProjectSummaryRow[]>([])
  const [filters, setFilters] = useState<ProjectSummaryFilters>({ status: '', dateFrom: '', dateTo: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load(): Promise<void> {
      setLoading(true)
      try {
        const [projects, allCosts, allRevenues, allLogs]: [
          ProjectWithClient[],
          ProjectCostWithRelations[],
          ProjectRevenueWithRelations[],
          DailyLogWithRelations[],
        ] = await Promise.all([
          api.projects.list(),
          api.costs.list(),
          api.revenues.list(),
          api.dailylogs.list(),
        ])

        let filtered = projects

        if (filters.status) {
          filtered = filtered.filter((p) => p.status === filters.status)
        }

        if (filters.dateFrom) {
          const from = parseLocalDate(filters.dateFrom)
          filtered = filtered.filter((p) => !p.startDate || isLocalDateWithinInclusiveRange(p.startDate, from))
        }

        if (filters.dateTo) {
          const to = endOfLocalDay(filters.dateTo)
          filtered = filtered.filter((p) => !p.startDate || isLocalDateWithinInclusiveRange(p.startDate, undefined, to))
        }

        const summaryRows: ProjectSummaryRow[] = filtered.map((project) => {
          const costs = allCosts
            .filter((c) => c.projectId === project.id)
            .reduce((sum, c) => sum + Number(c.amount), 0)

          const revenues = allRevenues
            .filter((r) => r.projectId === project.id)
            .reduce((sum, r) => sum + Number(r.amount), 0)

          const hours = allLogs
            .filter((l) => l.projectId === project.id)
            .reduce((sum, l) => sum + Number(l.hoursWorked), 0)

          return {
            id: project.id,
            name: project.name,
            clientName: project.clientName,
            status: project.status,
            totalHours: hours,
            totalCosts: costs,
            totalRevenues: revenues,
            profit: revenues - costs,
          }
        })

        setRows(summaryRows)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [filters])

  const hasActiveFilters = filters.status !== '' || filters.dateFrom !== '' || filters.dateTo !== ''

  function clearFilters(): void {
    setFilters({ status: '', dateFrom: '', dateTo: '' })
  }

  const totalCosts = rows.reduce((sum, r) => sum + r.totalCosts, 0)
  const totalRevenues = rows.reduce((sum, r) => sum + r.totalRevenues, 0)
  const totalProfit = totalRevenues - totalCosts

  const columns = [
    {
      key: 'name',
      label: t('reports:projectSummary.columns.project'),
      render: (row: ProjectSummaryRow) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'clientName',
      label: t('reports:projectSummary.columns.client'),
      render: (row: ProjectSummaryRow) => row.clientName ?? t('common:emptyValue'),
    },
    {
      key: 'status',
      label: t('reports:projectSummary.columns.status'),
      render: (row: ProjectSummaryRow) => <StatusBadge status={row.status} />,
    },
    {
      key: 'totalHours',
      label: t('reports:projectSummary.columns.totalHours'),
      render: (row: ProjectSummaryRow) => formatDecimal(row.totalHours, locale),
    },
    {
      key: 'totalCosts',
      label: t('reports:projectSummary.columns.totalCosts'),
      render: (row: ProjectSummaryRow) => formatCurrency(row.totalCosts, locale),
    },
    {
      key: 'totalRevenues',
      label: t('reports:projectSummary.columns.totalRevenues'),
      render: (row: ProjectSummaryRow) => formatCurrency(row.totalRevenues, locale),
    },
    {
      key: 'profit',
      label: t('reports:projectSummary.columns.profit'),
      render: (row: ProjectSummaryRow) => (
        <span className={row.profit >= 0 ? 'font-medium text-success' : 'font-medium text-destructive'}>
          {formatCurrency(row.profit, locale)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <FilterPanel>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('reports:filters.status')}</label>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as Project['status'] | '' }))}
            className="min-w-[12rem] text-[15px]"
          >
            <option value="">{t('reports:filters.allStatuses')}</option>
            <option value="planned">{t('common:status.planned')}</option>
            <option value="active">{t('common:status.active')}</option>
            <option value="completed">{t('common:status.completed')}</option>
            <option value="canceled">{t('common:status.canceled')}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('reports:filters.dateFrom')}</label>
          <DatePicker
            value={filters.dateFrom}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateFrom: value }))}
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('reports:filters.dateTo')}</label>
          <DatePicker
            value={filters.dateTo}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateTo: value }))}
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            {t('reports:filters.clear')}
          </Button>
        )}
      </FilterPanel>

      {!loading && rows.length > 0 && (
        <div className="mb-4 flex gap-4">
          <div className={`${reportCardClass} flex-1 bg-brand-orange/12`}>
            <p className="text-sm text-muted-foreground">{t('reports:projectSummary.summary.totalCosts')}</p>
            <p className="text-xl font-semibold text-destructive">{formatCurrency(totalCosts, locale)}</p>
          </div>
          <div className={`${reportCardClass} flex-1 bg-brand-sky/12`}>
            <p className="text-sm text-muted-foreground">{t('reports:projectSummary.summary.totalRevenues')}</p>
            <p className="text-xl font-semibold text-success">{formatCurrency(totalRevenues, locale)}</p>
          </div>
          <div className={`${reportCardClass} flex-1`}>
            <p className="text-sm text-muted-foreground">{t('reports:projectSummary.summary.totalProfit')}</p>
            <p className={`text-xl font-semibold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(totalProfit, locale)}
            </p>
          </div>
          <div className={`${reportCardClass} flex-1`}>
            <p className="text-sm text-muted-foreground">{t('reports:projectSummary.summary.projects')}</p>
            <p className="text-xl font-semibold">{rows.length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton columns={6} />
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('reports:projectSummary.empty')}</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  )
}

function DailyLogsTab(): JSX.Element {
  const { t, i18n } = useTranslation(['reports', 'common'])
  const locale = i18n.language as SupportedLocale
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [filters, setFilters] = useState<DailyLogFilters>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.projects.list().then(setProjects)
  }, [])

  useEffect(() => {
    async function load(): Promise<void> {
      setLoading(true)
      try {
        const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '')
        const data = await api.dailylogs.list(hasFilters ? filters : undefined)
        setLogs(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filters])

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '')

  function clearFilters(): void {
    setFilters({})
  }

  const totalHours = logs.reduce((sum, l) => sum + Number(l.hoursWorked), 0)

  const columns = [
    {
      key: 'date',
      label: t('reports:dailyLogs.columns.date'),
      render: (row: DailyLogWithRelations) => formatDate(row.date, locale),
    },
    {
      key: 'projectName',
      label: t('reports:dailyLogs.columns.project'),
      render: (row: DailyLogWithRelations) => row.projectName ?? t('common:emptyValue'),
    },
    {
      key: 'machineName',
      label: t('reports:dailyLogs.columns.machine'),
      render: (row: DailyLogWithRelations) => row.machineName ?? t('common:emptyValue'),
    },
    {
      key: 'operatorName',
      label: t('reports:dailyLogs.columns.operator'),
      render: (row: DailyLogWithRelations) => row.operatorName ?? t('common:emptyValue'),
    },
    {
      key: 'hoursWorked',
      label: t('reports:dailyLogs.columns.hours'),
      render: (row: DailyLogWithRelations) => formatDecimal(Number(row.hoursWorked), locale),
    },
    {
      key: 'fuelQuantity',
      label: t('reports:dailyLogs.columns.fuel'),
      render: (row: DailyLogWithRelations) =>
        row.fuelQuantity != null
          ? formatDecimal(Number(row.fuelQuantity), locale)
          : t('common:emptyValue'),
    },
    {
      key: 'workDescription',
      label: t('reports:dailyLogs.columns.workDescription'),
      render: (row: DailyLogWithRelations) => row.workDescription ?? t('common:emptyValue'),
    },
  ]

  return (
    <div>
      <FilterPanel>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('reports:filters.project')}</label>
          <Select
            value={filters.projectId !== undefined ? String(filters.projectId) : ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                projectId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="min-w-[13rem] text-[15px]"
          >
            <option value="">{t('reports:filters.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('reports:filters.dateFrom')}</label>
          <DatePicker
            value={filters.dateFrom ?? ''}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateFrom: value || undefined }))}
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('reports:filters.dateTo')}</label>
          <DatePicker
            value={filters.dateTo ?? ''}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateTo: value || undefined }))}
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            {t('reports:filters.clear')}
          </Button>
        )}
      </FilterPanel>

      {!loading && logs.length > 0 && (
        <div className="mb-4 flex gap-4">
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">{t('reports:dailyLogs.summary.totalRecords')}</p>
            <p className="text-xl font-semibold">{logs.length}</p>
          </div>
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">{t('reports:dailyLogs.summary.totalHours')}</p>
            <p className="text-xl font-semibold">{formatDecimal(totalHours, locale)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton columns={5} />
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('reports:dailyLogs.empty')}</p>
      ) : (
        <DataTable columns={columns} data={logs} />
      )}
    </div>
  )
}

function MachineUsageTab(): JSX.Element {
  const { t, i18n } = useTranslation(['reports', 'common'])
  const locale = i18n.language as SupportedLocale
  const [rows, setRows] = useState<MachineUsageRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load(): Promise<void> {
      setLoading(true)
      try {
        const [machines, logs]: [Machine[], DailyLogWithRelations[]] = await Promise.all([
          api.machines.list(),
          api.dailylogs.list(),
        ])

        const usageRows: MachineUsageRow[] = machines.map((machine) => {
          const machineLogs = logs.filter((l) => l.machineId === machine.id)
          return {
            id: machine.id,
            name: machine.name,
            type: machine.type,
            totalHours: machineLogs.reduce((sum, l) => sum + Number(l.hoursWorked), 0),
            logCount: machineLogs.length,
          }
        })

        usageRows.sort((a, b) => b.totalHours - a.totalHours)
        setRows(usageRows)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const columns = [
    {
      key: 'name',
      label: t('reports:machineUsage.columns.machine'),
      render: (row: MachineUsageRow) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'type',
      label: t('reports:machineUsage.columns.type'),
      render: (row: MachineUsageRow) => row.type,
    },
    {
      key: 'totalHours',
      label: t('reports:machineUsage.columns.totalHours'),
      render: (row: MachineUsageRow) => (
        <span className={row.totalHours > 0 ? 'font-medium' : 'text-muted-foreground'}>
          {formatDecimal(row.totalHours, locale)}
        </span>
      ),
    },
    {
      key: 'logCount',
      label: t('reports:machineUsage.columns.logCount'),
      render: (row: MachineUsageRow) => row.logCount,
    },
  ]

  const totalHours = rows.reduce((sum, r) => sum + r.totalHours, 0)
  const activeMachines = rows.filter((r) => r.totalHours > 0).length

  return (
    <div>
      {!loading && rows.length > 0 && (
        <div className="mb-4 flex gap-4">
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">{t('reports:machineUsage.summary.totalMachines')}</p>
            <p className="text-xl font-semibold">{rows.length}</p>
          </div>
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">{t('reports:machineUsage.summary.activeMachines')}</p>
            <p className="text-xl font-semibold">{activeMachines}</p>
          </div>
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">{t('reports:machineUsage.summary.totalHours')}</p>
            <p className="text-xl font-semibold">{formatDecimal(totalHours, locale)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton columns={4} />
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('reports:machineUsage.empty')}</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  )
}

function CostsByCategoryTab(): JSX.Element {
  const { t, i18n } = useTranslation(['reports', 'common'])
  const locale = i18n.language as SupportedLocale
  const [costs, setCosts] = useState<ProjectCostWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [filters, setFilters] = useState<CostFilters>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.projects.list().then(setProjects)
  }, [])

  useEffect(() => {
    async function load(): Promise<void> {
      setLoading(true)
      try {
        const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '')
        const data = await api.costs.list(hasFilters ? filters : undefined)
        setCosts(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filters])

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '')

  function clearFilters(): void {
    setFilters({})
  }

  const categoryLabels: Record<CostCategory, string> = {
    fuel: t('reports:categories.fuel'),
    labor: t('reports:categories.labor'),
    maintenance: t('reports:categories.maintenance'),
    transport: t('reports:categories.transport'),
    outsourced: t('reports:categories.outsourced'),
    miscellaneous: t('reports:categories.miscellaneous'),
  }

  const categorySummary: CategorySummaryRow[] = Object.entries(categoryLabels)
    .map(([cat, label]) => {
      const catCosts = costs.filter((c) => c.category === cat)
      return {
        category: cat as CostCategory,
        label,
        total: catCosts.reduce((sum, c) => sum + Number(c.amount), 0),
        count: catCosts.length,
      }
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.total - a.total)

  const grandTotal = costs.reduce((sum, c) => sum + Number(c.amount), 0)

  const summaryColumns = [
    {
      key: 'label',
      label: t('reports:costsByCategory.columns.category'),
      render: (row: CategorySummaryRow) => <span className="font-medium">{row.label}</span>,
    },
    {
      key: 'count',
      label: t('reports:costsByCategory.columns.entries'),
      render: (row: CategorySummaryRow) => row.count,
    },
    {
      key: 'total',
      label: t('reports:costsByCategory.columns.total'),
      render: (row: CategorySummaryRow) => (
        <span className="font-medium">{formatCurrency(row.total, locale)}</span>
      ),
    },
    {
      key: 'pct',
      label: t('reports:costsByCategory.columns.share'),
      render: (row: CategorySummaryRow) => {
        const pct = grandTotal > 0 ? (row.total / grandTotal) * 100 : 0
        return `${formatDecimal(pct, locale)}%`
      },
    },
  ]

  const detailColumns = [
    {
      key: 'date',
      label: t('reports:costsByCategory.detailColumns.date'),
      render: (row: ProjectCostWithRelations) => formatDate(row.date, locale),
    },
    {
      key: 'projectName',
      label: t('reports:costsByCategory.detailColumns.project'),
      render: (row: ProjectCostWithRelations) => row.projectName ?? t('common:emptyValue'),
    },
    {
      key: 'category',
      label: t('reports:costsByCategory.detailColumns.category'),
      render: (row: ProjectCostWithRelations) =>
        t(`reports:categories.${row.category}`, { defaultValue: row.category }),
    },
    {
      key: 'description',
      label: t('reports:costsByCategory.detailColumns.description'),
      render: (row: ProjectCostWithRelations) => row.description,
    },
    {
      key: 'amount',
      label: t('reports:costsByCategory.detailColumns.amount'),
      render: (row: ProjectCostWithRelations) => formatCurrency(Number(row.amount), locale),
    },
  ]

  return (
    <div>
      <FilterPanel>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('reports:filters.project')}</label>
          <Select
            value={filters.projectId !== undefined ? String(filters.projectId) : ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                projectId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="min-w-[13rem] text-[15px]"
          >
            <option value="">{t('reports:filters.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('reports:filters.dateFrom')}</label>
          <DatePicker
            value={filters.dateFrom ?? ''}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateFrom: value || undefined }))}
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">{t('reports:filters.dateTo')}</label>
          <DatePicker
            value={filters.dateTo ?? ''}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateTo: value || undefined }))}
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            {t('reports:filters.clear')}
          </Button>
        )}
      </FilterPanel>

      {loading ? (
        <TableSkeleton columns={4} />
      ) : costs.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('reports:costsByCategory.empty')}</p>
      ) : (
        <>
          <div className={`${reportCardClass} mb-4 inline-block bg-brand-orange/12`}>
            <p className="text-sm text-muted-foreground">{t('reports:costsByCategory.summary.totalLabel')}</p>
            <p className="text-xl font-semibold text-destructive">{formatCurrency(grandTotal, locale)}</p>
          </div>

          <h3 className="mb-2 text-base font-semibold">{t('reports:costsByCategory.summary.title')}</h3>
          <div className="mb-6">
            <DataTable columns={summaryColumns} data={categorySummary} />
          </div>

          <h3 className="mb-2 text-base font-semibold">{t('reports:costsByCategory.detail.title')}</h3>
          <DataTable columns={detailColumns} data={costs} />
        </>
      )}
    </div>
  )
}

export function ReportsPage(): JSX.Element {
  const { t } = useTranslation(['reports', 'common'])

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('reports:title')} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Tabs defaultValue="project-summary">
          <TabsList>
            <TabsTrigger value="project-summary">{t('reports:tabs.projectSummary')}</TabsTrigger>
            <TabsTrigger value="daily-logs">{t('reports:tabs.dailyLogs')}</TabsTrigger>
            <TabsTrigger value="machine-usage">{t('reports:tabs.machineUsage')}</TabsTrigger>
            <TabsTrigger value="costs-by-category">{t('reports:tabs.costsByCategory')}</TabsTrigger>
          </TabsList>

          <TabsContent value="project-summary">
            <ProjectSummaryTab />
          </TabsContent>

          <TabsContent value="daily-logs">
            <DailyLogsTab />
          </TabsContent>

          <TabsContent value="machine-usage">
            <MachineUsageTab />
          </TabsContent>

          <TabsContent value="costs-by-category">
            <CostsByCategoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
