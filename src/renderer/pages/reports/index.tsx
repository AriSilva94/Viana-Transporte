import { useState, useEffect } from 'react'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { FilterPanel } from '@renderer/components/shared/FilterPanel'
import { StatusBadge } from '@renderer/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { Select } from '@renderer/components/ui/select'
import { Button } from '@renderer/components/ui/button'
import { DatePicker } from '@renderer/components/ui/date-picker'
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
} from '../../../shared/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number): string {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

const reportCardClass = 'rounded-3xl border border-border/80 bg-white/82 p-4 shadow-sm backdrop-blur-sm'

type CostCategory = ProjectCost['category']

const CATEGORY_LABELS: Record<CostCategory, string> = {
  fuel: 'Combustível',
  labor: 'Mão de obra',
  maintenance: 'Manutenção',
  transport: 'Transporte',
  outsourced: 'Serviço terceirizado',
  miscellaneous: 'Diversos',
}

const STATUS_OPTIONS: { value: Project['status'] | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'planned', label: 'Planejado' },
  { value: 'active', label: 'Ativo' },
  { value: 'completed', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
]

// ─── Project Summary Tab ──────────────────────────────────────────────────────

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

function ProjectSummaryTab(): JSX.Element {
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

        let filtered = projects as ProjectWithClient[]

        if (filters.status) {
          filtered = filtered.filter((p) => p.status === filters.status)
        }

        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom)
          filtered = filtered.filter((p) => !p.startDate || new Date(p.startDate) >= from)
        }

        if (filters.dateTo) {
          const to = new Date(filters.dateTo)
          filtered = filtered.filter((p) => !p.startDate || new Date(p.startDate) <= to)
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
      label: 'Projeto',
      render: (row: ProjectSummaryRow) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'clientName',
      label: 'Cliente',
      render: (row: ProjectSummaryRow) => row.clientName ?? '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: ProjectSummaryRow) => <StatusBadge status={row.status} />,
    },
    {
      key: 'totalHours',
      label: 'Horas Totais',
      render: (row: ProjectSummaryRow) => `${Number(row.totalHours).toFixed(1)} h`,
    },
    {
      key: 'totalCosts',
      label: 'Total Custos',
      render: (row: ProjectSummaryRow) => formatCurrency(row.totalCosts),
    },
    {
      key: 'totalRevenues',
      label: 'Total Receitas',
      render: (row: ProjectSummaryRow) => formatCurrency(row.totalRevenues),
    },
    {
      key: 'profit',
      label: 'Resultado',
      render: (row: ProjectSummaryRow) => (
        <span className={row.profit >= 0 ? 'font-medium text-success' : 'font-medium text-destructive'}>
          {formatCurrency(row.profit)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <FilterPanel>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Status</label>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as Project['status'] | '' }))}
            className="min-w-[12rem] text-[15px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Data início (de)</label>
          <DatePicker
            value={filters.dateFrom}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateFrom: value }))}
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Data início (até)</label>
          <DatePicker
            value={filters.dateTo}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateTo: value }))}
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </FilterPanel>

      {!loading && rows.length > 0 && (
        <div className="flex gap-4 mb-4">
          <div className={`${reportCardClass} flex-1 bg-brand-orange/12`}>
            <p className="text-sm text-muted-foreground">Total Custos</p>
            <p className="text-xl font-semibold text-destructive">{formatCurrency(totalCosts)}</p>
          </div>
          <div className={`${reportCardClass} flex-1 bg-brand-sky/12`}>
            <p className="text-sm text-muted-foreground">Total Receitas</p>
            <p className="text-xl font-semibold text-success">{formatCurrency(totalRevenues)}</p>
          </div>
          <div className={`${reportCardClass} flex-1`}>
            <p className="text-sm text-muted-foreground">Resultado Total</p>
            <p className={`text-xl font-semibold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
          <div className={`${reportCardClass} flex-1`}>
            <p className="text-sm text-muted-foreground">Projetos</p>
            <p className="text-xl font-semibold">{rows.length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum projeto encontrado.</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  )
}

// ─── Daily Logs Tab ───────────────────────────────────────────────────────────

function DailyLogsTab(): JSX.Element {
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
      label: 'Data',
      render: (row: DailyLogWithRelations) => formatDate(row.date),
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
      render: (row: DailyLogWithRelations) => `${Number(row.hoursWorked).toFixed(1)} h`,
    },
    {
      key: 'fuelQuantity',
      label: 'Combustível',
      render: (row: DailyLogWithRelations) =>
        row.fuelQuantity != null ? `${Number(row.fuelQuantity).toFixed(1)} L` : '—',
    },
    {
      key: 'workDescription',
      label: 'Serviço',
      render: (row: DailyLogWithRelations) => row.workDescription ?? '—',
    },
  ]

  return (
    <div>
      <FilterPanel>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Projeto</label>
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
          <DatePicker
            value={filters.dateFrom ?? ''}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, dateFrom: value || undefined }))
            }
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Data final</label>
          <DatePicker
            value={filters.dateTo ?? ''}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, dateTo: value || undefined }))
            }
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </FilterPanel>

      {!loading && logs.length > 0 && (
        <div className="flex gap-4 mb-4">
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">Total de Registros</p>
            <p className="text-xl font-semibold">{logs.length}</p>
          </div>
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">Total de Horas</p>
            <p className="text-xl font-semibold">{totalHours.toFixed(1)} h</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum registro diário encontrado.</p>
      ) : (
        <DataTable columns={columns} data={logs} />
      )}
    </div>
  )
}

// ─── Machine Usage Tab ────────────────────────────────────────────────────────

interface MachineUsageRow {
  id: number
  name: string
  type: string
  totalHours: number
  logCount: number
}

function MachineUsageTab(): JSX.Element {
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
      label: 'Máquina',
      render: (row: MachineUsageRow) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (row: MachineUsageRow) => row.type,
    },
    {
      key: 'totalHours',
      label: 'Total de Horas',
      render: (row: MachineUsageRow) => (
        <span className={row.totalHours > 0 ? 'font-medium' : 'text-muted-foreground'}>
          {Number(row.totalHours).toFixed(1)} h
        </span>
      ),
    },
    {
      key: 'logCount',
      label: 'Nº de Registros',
      render: (row: MachineUsageRow) => row.logCount,
    },
  ]

  const totalHours = rows.reduce((sum, r) => sum + r.totalHours, 0)
  const activeMachines = rows.filter((r) => r.totalHours > 0).length

  return (
    <div>
      {!loading && rows.length > 0 && (
        <div className="flex gap-4 mb-4">
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">Total de Máquinas</p>
            <p className="text-xl font-semibold">{rows.length}</p>
          </div>
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">Máquinas com Uso</p>
            <p className="text-xl font-semibold">{activeMachines}</p>
          </div>
          <div className={reportCardClass}>
            <p className="text-sm text-muted-foreground">Total Horas Registradas</p>
            <p className="text-xl font-semibold">{totalHours.toFixed(1)} h</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma máquina cadastrada.</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  )
}

// ─── Costs by Category Tab ────────────────────────────────────────────────────

interface CategorySummaryRow {
  category: CostCategory
  label: string
  total: number
  count: number
}

function CostsByCategoryTab(): JSX.Element {
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

  const categorySummary: CategorySummaryRow[] = Object.entries(CATEGORY_LABELS).map(
    ([cat, label]) => {
      const catCosts = costs.filter((c) => c.category === cat)
      return {
        category: cat as CostCategory,
        label,
        total: catCosts.reduce((sum, c) => sum + Number(c.amount), 0),
        count: catCosts.length,
      }
    }
  ).filter((r) => r.count > 0)
    .sort((a, b) => b.total - a.total)

  const grandTotal = costs.reduce((sum, c) => sum + Number(c.amount), 0)

  const summaryColumns = [
    {
      key: 'label',
      label: 'Categoria',
      render: (row: CategorySummaryRow) => <span className="font-medium">{row.label}</span>,
    },
    {
      key: 'count',
      label: 'Nº de Lançamentos',
      render: (row: CategorySummaryRow) => row.count,
    },
    {
      key: 'total',
      label: 'Total',
      render: (row: CategorySummaryRow) => (
        <span className="font-medium">{formatCurrency(row.total)}</span>
      ),
    },
    {
      key: 'pct',
      label: '% do Total',
      render: (row: CategorySummaryRow) => {
        const pct = grandTotal > 0 ? (row.total / grandTotal) * 100 : 0
        return `${pct.toFixed(1)}%`
      },
    },
  ]

  const detailColumns = [
    {
      key: 'date',
      label: 'Data',
      render: (row: ProjectCostWithRelations) => formatDate(row.date),
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
      render: (row: ProjectCostWithRelations) => formatCurrency(Number(row.amount)),
    },
  ]

  return (
    <div>
      <FilterPanel>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Projeto</label>
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
          <DatePicker
            value={filters.dateFrom ?? ''}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, dateFrom: value || undefined }))
            }
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Data final</label>
          <DatePicker
            value={filters.dateTo ?? ''}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, dateTo: value || undefined }))
            }
            className="min-w-[12rem] text-[15px]"
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </FilterPanel>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : costs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum custo encontrado.</p>
      ) : (
        <>
          <div className={`${reportCardClass} mb-4 inline-block bg-brand-orange/12`}>
            <p className="text-sm text-muted-foreground">Total Geral</p>
            <p className="text-xl font-semibold text-destructive">{formatCurrency(grandTotal)}</p>
          </div>

          <h3 className="text-base font-semibold mb-2">Resumo por Categoria</h3>
          <div className="mb-6">
            <DataTable columns={summaryColumns} data={categorySummary} />
          </div>

          <h3 className="text-base font-semibold mb-2">Todos os Lançamentos</h3>
          <DataTable columns={detailColumns} data={costs} />
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ReportsPage(): JSX.Element {
  return (
    <div>
      <PageHeader title="Relatórios" />

      <Tabs defaultValue="projetos">
        <TabsList>
          <TabsTrigger value="projetos">Resumo de Projetos</TabsTrigger>
          <TabsTrigger value="diarios">Registros Diários</TabsTrigger>
          <TabsTrigger value="maquinas">Uso de Máquinas</TabsTrigger>
          <TabsTrigger value="custos">Custos por Categoria</TabsTrigger>
        </TabsList>

        <TabsContent value="projetos">
          <ProjectSummaryTab />
        </TabsContent>

        <TabsContent value="diarios">
          <DailyLogsTab />
        </TabsContent>

        <TabsContent value="maquinas">
          <MachineUsageTab />
        </TabsContent>

        <TabsContent value="custos">
          <CostsByCategoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
