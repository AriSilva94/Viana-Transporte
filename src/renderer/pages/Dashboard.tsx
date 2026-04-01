import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { StatusBadge } from '@renderer/components/ui/badge'
import {
  Activity,
  BriefcaseBusiness,
  CircleDollarSign,
  FolderKanban,
  Hammer,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type {
  ProjectWithClient,
  Machine,
  DailyLogWithRelations,
  ProjectCostWithRelations,
  ProjectRevenueWithRelations,
} from '../../shared/types'

function formatCurrency(val: number): string {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}

interface MetricCardProps {
  label: string
  value: string | number
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  tone: 'deep' | 'sky' | 'sand' | 'orange' | 'light'
}

function MetricCard({ label, value, hint, icon: Icon, tone }: MetricCardProps): JSX.Element {
  const toneClassMap: Record<MetricCardProps['tone'], string> = {
    deep: 'border-brand-deep/30 bg-brand-deep text-white shadow-[0_20px_45px_rgba(56,82,180,0.22)]',
    sky: 'border-brand-sky/30 bg-brand-sky text-white shadow-[0_20px_45px_rgba(94,122,196,0.22)]',
    sand: 'border-brand-sand/60 bg-brand-sand/75 text-brand-ink shadow-[0_20px_45px_rgba(243,190,122,0.22)]',
    orange:
      'border-brand-orange/45 bg-gradient-to-br from-brand-sand/75 to-brand-orange/55 text-brand-ink shadow-[0_20px_45px_rgba(240,141,57,0.18)]',
    light: 'border-border/80 bg-white/88 text-foreground shadow-sm backdrop-blur-sm',
  }

  const mutedToneClassMap: Record<MetricCardProps['tone'], string> = {
    deep: 'text-white/72',
    sky: 'text-white/72',
    sand: 'text-brand-ink/68',
    orange: 'text-brand-ink/72',
    light: 'text-muted-foreground',
  }

  return (
    <div className={`rounded-3xl border p-5 ${toneClassMap[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-medium ${mutedToneClassMap[tone]}`}>{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
          {hint ? <p className={`mt-2 text-xs ${mutedToneClassMap[tone]}`}>{hint}</p> : null}
        </div>
        <div className="rounded-2xl bg-white/16 p-3 backdrop-blur-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

interface SectionCardProps {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

function SectionCard({ eyebrow, title, description, children }: SectionCardProps): JSX.Element {
  return (
    <section className="rounded-[28px] border border-border/80 bg-white/82 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-brand-sand/25 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{title}</h2>
        </div>
        <p className="max-w-md text-right text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function DashboardEmptyState({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-dashed border-brand-sky/30 bg-brand-sand/10 px-5 py-10 text-center">
      <div className="mx-auto mb-3 h-2 w-20 rounded-full bg-gradient-to-r from-brand-deep via-brand-sky to-brand-orange" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [recentLogs, setRecentLogs] = useState<DailyLogWithRelations[]>([])
  const [costs, setCosts] = useState<ProjectCostWithRelations[]>([])
  const [revenues, setRevenues] = useState<ProjectRevenueWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load(): Promise<void> {
      setIsLoading(true)
      const [p, m, l, c, r] = await Promise.all([
        api.projects.list(),
        api.machines.list(),
        api.dailylogs.list(),
        api.costs.list(),
        api.revenues.list(),
      ])
      setProjects(p)
      setMachines(m)
      setRecentLogs(l)
      setCosts(c)
      setRevenues(r)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>
  }

  const activeProjects = projects.filter((p) => p.status === 'active')
  const completedProjects = projects.filter((p) => p.status === 'completed')
  const allocatedMachines = machines.filter((m) => m.status === 'allocated')
  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
  const totalRevenues = revenues.reduce((sum, r) => sum + r.amount, 0)
  const profit = totalRevenues - totalCosts
  const last5Logs = recentLogs.slice(0, 5)
  const top5Active = activeProjects.slice(0, 5)
  const resultTone = profit >= 0 ? 'sky' : 'orange'

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/60 bg-gradient-to-r from-brand-deep via-brand-sky to-brand-orange px-6 py-7 text-white shadow-[0_24px_60px_rgba(56,82,180,0.22)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-sand/90">
          Visao geral
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Acompanhe operacao, custos, receitas e o desempenho dos projetos em um unico painel.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Projetos Ativos"
          value={activeProjects.length}
          hint="Em andamento neste momento"
          icon={Activity}
          tone="deep"
        />
        <MetricCard
          label="Projetos Concluídos"
          value={completedProjects.length}
          hint="Entregas finalizadas"
          icon={FolderKanban}
          tone="sky"
        />
        <MetricCard
          label="Total de Máquinas"
          value={machines.length}
          hint={`${allocatedMachines.length} em uso`}
          icon={Hammer}
          tone="sand"
        />
        <MetricCard
          label="Total de Projetos"
          value={projects.length}
          hint="Base geral cadastrada"
          icon={BriefcaseBusiness}
          tone="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <MetricCard
          label="Total de Custos"
          value={formatCurrency(totalCosts)}
          hint="Saídas acumuladas"
          icon={TrendingDown}
          tone="orange"
        />
        <MetricCard
          label="Total de Receitas"
          value={formatCurrency(totalRevenues)}
          hint="Entradas acumuladas"
          icon={TrendingUp}
          tone="sky"
        />
        <MetricCard
          label="Resultado"
          value={formatCurrency(profit)}
          hint={profit >= 0 ? 'Operação com saldo positivo' : 'Operação requer atenção'}
          icon={CircleDollarSign}
          tone={resultTone}
        />
      </div>

      <SectionCard
        eyebrow="Atividade"
        title="Últimos Registros Diários"
        description="Acompanhe os lançamentos operacionais mais recentes para manter a rotina sob controle."
      >
        {last5Logs.length === 0 ? (
          <DashboardEmptyState message="Nenhum registro diário foi lançado ainda." />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-white/80 shadow-sm backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead className="bg-brand-sand/18">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Data</th>
                  <th className="text-left px-4 py-2 font-medium">Projeto</th>
                  <th className="text-left px-4 py-2 font-medium">Máquina</th>
                  <th className="text-left px-4 py-2 font-medium">Operador</th>
                  <th className="text-left px-4 py-2 font-medium">Horas</th>
                </tr>
              </thead>
              <tbody>
                {last5Logs.map((log) => (
                  <tr key={log.id} className="border-t border-border/70 hover:bg-brand-sky/8">
                    <td className="px-4 py-2">{formatDate(log.date)}</td>
                    <td className="px-4 py-2">{log.projectName ?? '—'}</td>
                    <td className="px-4 py-2">{log.machineName ?? '—'}</td>
                    <td className="px-4 py-2">{log.operatorName ?? '—'}</td>
                    <td className="px-4 py-2">{log.hoursWorked}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Pipeline"
        title="Projetos em Destaque"
        description="Veja rapidamente os projetos ativos e entre direto no detalhe do que precisa de atenção."
      >
        {top5Active.length === 0 ? (
          <DashboardEmptyState message="Ainda não existem projetos ativos para exibir aqui." />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-white/80 shadow-sm backdrop-blur-sm">
            {top5Active.map((project) => (
              <div
                key={project.id}
                className="flex cursor-pointer items-center justify-between border-b border-border/70 px-4 py-4 transition-colors last:border-0 hover:bg-brand-sand/14"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{project.name}</span>
                  <StatusBadge status={project.status} />
                </div>
                <span className="text-sm text-muted-foreground">{project.clientName ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
