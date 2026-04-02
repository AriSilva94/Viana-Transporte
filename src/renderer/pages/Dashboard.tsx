import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { formatCurrency, formatDate } from '@renderer/lib/format'
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
  SupportedLocale,
} from '../../shared/types'

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
  const { t, i18n } = useTranslation(['dashboard', 'navigation', 'common'])
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [recentLogs, setRecentLogs] = useState<DailyLogWithRelations[]>([])
  const [costs, setCosts] = useState<ProjectCostWithRelations[]>([])
  const [revenues, setRevenues] = useState<ProjectRevenueWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const locale = i18n.language as SupportedLocale

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
    return <div className="text-muted-foreground">{t('common:loading')}</div>
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
  const formatHoursValue = (value: number): string =>
    t('dashboard:hoursValue', {
      value: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value),
    })

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/60 bg-gradient-to-r from-brand-deep via-brand-sky to-brand-orange px-6 py-7 text-white shadow-[0_24px_60px_rgba(56,82,180,0.22)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-sand/90">
          {t('dashboard:overview')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{t('navigation:dashboard')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          {t('dashboard:description')}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('dashboard:metrics.activeProjects.label')}
          value={activeProjects.length}
          hint={t('dashboard:metrics.activeProjects.hint')}
          icon={Activity}
          tone="deep"
        />
        <MetricCard
          label={t('dashboard:metrics.completedProjects.label')}
          value={completedProjects.length}
          hint={t('dashboard:metrics.completedProjects.hint')}
          icon={FolderKanban}
          tone="sky"
        />
        <MetricCard
          label={t('dashboard:metrics.totalMachines.label')}
          value={machines.length}
          hint={t('dashboard:metrics.totalMachines.hint', { count: allocatedMachines.length })}
          icon={Hammer}
          tone="sand"
        />
        <MetricCard
          label={t('dashboard:metrics.totalProjects.label')}
          value={projects.length}
          hint={t('dashboard:metrics.totalProjects.hint')}
          icon={BriefcaseBusiness}
          tone="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <MetricCard
          label={t('dashboard:metrics.totalCosts.label')}
          value={formatCurrency(totalCosts, locale)}
          hint={t('dashboard:metrics.totalCosts.hint')}
          icon={TrendingDown}
          tone="orange"
        />
        <MetricCard
          label={t('dashboard:metrics.totalRevenues.label')}
          value={formatCurrency(totalRevenues, locale)}
          hint={t('dashboard:metrics.totalRevenues.hint')}
          icon={TrendingUp}
          tone="sky"
        />
        <MetricCard
          label={t('dashboard:metrics.result.label')}
          value={formatCurrency(profit, locale)}
          hint={
            profit >= 0
              ? t('dashboard:metrics.result.positiveHint')
              : t('dashboard:metrics.result.negativeHint')
          }
          icon={CircleDollarSign}
          tone={resultTone}
        />
      </div>

      <SectionCard
        eyebrow={t('dashboard:recentLogs.eyebrow')}
        title={t('dashboard:recentLogs.title')}
        description={t('dashboard:recentLogs.description')}
      >
        {last5Logs.length === 0 ? (
          <DashboardEmptyState message={t('dashboard:recentLogs.empty')} />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-white/80 shadow-sm backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead className="bg-brand-sand/18">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">{t('dashboard:table.date')}</th>
                  <th className="text-left px-4 py-2 font-medium">{t('dashboard:table.project')}</th>
                  <th className="text-left px-4 py-2 font-medium">{t('dashboard:table.machine')}</th>
                  <th className="text-left px-4 py-2 font-medium">{t('dashboard:table.operator')}</th>
                  <th className="text-left px-4 py-2 font-medium">{t('dashboard:table.hours')}</th>
                </tr>
              </thead>
              <tbody>
                {last5Logs.map((log) => (
                  <tr key={log.id} className="border-t border-border/70 hover:bg-brand-sky/8">
                    <td className="px-4 py-2">{formatDate(log.date, locale)}</td>
                    <td className="px-4 py-2">{log.projectName ?? t('common:emptyValue')}</td>
                    <td className="px-4 py-2">{log.machineName ?? t('common:emptyValue')}</td>
                    <td className="px-4 py-2">{log.operatorName ?? t('common:emptyValue')}</td>
                    <td className="px-4 py-2">{formatHoursValue(log.hoursWorked)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        eyebrow={t('dashboard:highlightedProjects.eyebrow')}
        title={t('dashboard:highlightedProjects.title')}
        description={t('dashboard:highlightedProjects.description')}
      >
        {top5Active.length === 0 ? (
          <DashboardEmptyState message={t('dashboard:highlightedProjects.empty')} />
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
                <span className="text-sm text-muted-foreground">
                  {project.clientName ?? t('common:emptyValue')}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
