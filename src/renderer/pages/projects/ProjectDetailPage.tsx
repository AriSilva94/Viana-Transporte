import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { StatusBadge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import type { ProjectWithClient, ProjectSummary, DailyLogWithRelations, ProjectCostWithRelations, ProjectRevenueWithRelations } from '../../../shared/types'

const categoryLabels: Record<string, string> = {
  fuel: 'Combustível',
  labor: 'Mão de obra',
  maintenance: 'Manutenção',
  transport: 'Transporte',
  outsourced_service: 'Serviço terceirizado',
  outsourced: 'Serviço terceirizado',
  miscellaneous: 'Diversos',
}

export function ProjectDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectWithClient | null>(null)
  const [summary, setSummary] = useState<ProjectSummary>({
    totalCosts: 0,
    totalRevenues: 0,
    profit: 0,
    totalHours: 0,
  })
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([])
  const [costs, setCosts] = useState<ProjectCostWithRelations[]>([])
  const [revenues, setRevenues] = useState<ProjectRevenueWithRelations[]>([])

  useEffect(() => {
    const numId = Number(id)
    api.projects.get(numId).then(setProject)
    api.projects.summary(numId).then(setSummary)
    api.dailylogs.list({ projectId: numId }).then(setLogs)
    api.costs.list({ projectId: numId }).then(setCosts)
    api.revenues.list({ projectId: numId }).then(setRevenues)
  }, [id])

  if (!project) {
    return <div className="text-muted-foreground">Carregando...</div>
  }

  function formatCurrency(val: number): string {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function formatDate(d: Date | null): string {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR')
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        action={{ label: 'Editar', onClick: () => navigate(`/projects/${id}/edit`) }}
      />
      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="logs">Registros</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <span className="text-sm text-muted-foreground">Cliente</span>
              <p className="mt-1">{project.clientName ?? '—'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="mt-1"><StatusBadge status={project.status} /></div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Localização</span>
              <p className="mt-1">{project.location ?? '—'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Valor Contratado</span>
              <p className="mt-1">{project.contractAmount != null ? formatCurrency(project.contractAmount) : '—'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Data Início</span>
              <p className="mt-1">{formatDate(project.startDate)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Data Fim</span>
              <p className="mt-1">{formatDate(project.endDate)}</p>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">Descrição</span>
              <p className="mt-1">{project.description ?? '—'}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => navigate(`/daily-logs/new`)}>Novo Registro</Button>
          </div>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum registro diário para este projeto.</p>
          ) : (
            <DataTable
              columns={[
                { key: 'date', label: 'Data', render: (row: DailyLogWithRelations) => new Date(row.date).toLocaleDateString('pt-BR') },
                { key: 'machineName', label: 'Máquina', render: (row: DailyLogWithRelations) => row.machineName ?? '—' },
                { key: 'operatorName', label: 'Operador', render: (row: DailyLogWithRelations) => row.operatorName ?? '—' },
                { key: 'hoursWorked', label: 'Horas', render: (row: DailyLogWithRelations) => String(row.hoursWorked) },
                { key: 'workDescription', label: 'Serviço', render: (row: DailyLogWithRelations) => row.workDescription ?? '—' },
                { key: 'actions', label: 'Ações', render: (row: DailyLogWithRelations) => (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/daily-logs/${row.id}/edit`)}>Editar</Button>
                )},
              ]}
              data={logs}
            />
          )}
        </TabsContent>

        <TabsContent value="custos">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => navigate('/costs/new')}>Novo Custo</Button>
          </div>
          {costs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum custo registrado para este projeto.</p>
          ) : (
            <DataTable
              columns={[
                { key: 'date', label: 'Data', render: (row: ProjectCostWithRelations) => new Date(row.date).toLocaleDateString('pt-BR') },
                { key: 'category', label: 'Categoria', render: (row: ProjectCostWithRelations) => categoryLabels[row.category] ?? row.category },
                { key: 'description', label: 'Descrição', render: (row: ProjectCostWithRelations) => row.description },
                { key: 'amount', label: 'Valor', render: (row: ProjectCostWithRelations) => formatCurrency(Number(row.amount)) },
                { key: 'actions', label: 'Ações', render: (row: ProjectCostWithRelations) => (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/costs/${row.id}/edit`)}>Editar</Button>
                )},
              ]}
              data={costs}
            />
          )}
        </TabsContent>

        <TabsContent value="receitas">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => navigate('/revenues/new')}>Nova Receita</Button>
          </div>
          {revenues.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma receita registrada para este projeto.</p>
          ) : (
            <DataTable
              columns={[
                { key: 'date', label: 'Data', render: (row: ProjectRevenueWithRelations) => new Date(row.date).toLocaleDateString('pt-BR') },
                { key: 'description', label: 'Descrição', render: (row: ProjectRevenueWithRelations) => row.description },
                { key: 'amount', label: 'Valor', render: (row: ProjectRevenueWithRelations) => formatCurrency(Number(row.amount)) },
                { key: 'status', label: 'Status', render: (row: ProjectRevenueWithRelations) => <StatusBadge status={row.status} /> },
                { key: 'actions', label: 'Ações', render: (row: ProjectRevenueWithRelations) => (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/revenues/${row.id}/edit`)}>Editar</Button>
                )},
              ]}
              data={revenues}
            />
          )}
        </TabsContent>

        <TabsContent value="resumo">
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <span className="text-sm text-muted-foreground">Total de Custos</span>
              <p className="text-lg font-semibold mt-1">{formatCurrency(summary.totalCosts)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total de Receitas</span>
              <p className="text-lg font-semibold mt-1">{formatCurrency(summary.totalRevenues)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Lucro / Prejuízo</span>
              <p className={`text-lg font-semibold mt-1 ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.profit)}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total de Horas</span>
              <p className="text-lg font-semibold mt-1">{summary.totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
