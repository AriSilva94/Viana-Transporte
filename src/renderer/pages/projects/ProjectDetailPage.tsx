import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { formatCurrency, formatDate } from '@renderer/lib/format'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { SurfaceSection } from '@renderer/components/shared/SurfaceSection'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { StatusBadge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import type {
  ProjectWithClient,
  ProjectSummary,
  DailyLogWithRelations,
  ProjectCostWithRelations,
  ProjectRevenueWithRelations,
  SupportedLocale,
} from '../../../shared/types'

export function ProjectDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['projects', 'common'])
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
  const locale = i18n.language as SupportedLocale

  useEffect(() => {
    const numId = Number(id)
    api.projects.get(numId).then(setProject)
    api.projects.summary(numId).then(setSummary)
    api.dailylogs.list({ projectId: numId }).then(setLogs)
    api.costs.list({ projectId: numId }).then(setCosts)
    api.revenues.list({ projectId: numId }).then(setRevenues)
  }, [id])

  if (!project) {
    return <div className="text-muted-foreground">{t('common:loading')}</div>
  }
  const formatHoursValue = (value: number): string =>
    t('projects:detail.totalHoursValue', {
      value: new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value),
    })
  const getCategoryLabel = (category: string): string => {
    const translated = t(`projects:categories.${category}`)
    return translated === `projects:categories.${category}` ? category : translated
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        action={{ label: t('projects:detail.editAction'), onClick: () => navigate(`/projects/${id}/edit`) }}
      />
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t('projects:detail.tabs.general')}</TabsTrigger>
          <TabsTrigger value="logs">{t('projects:detail.tabs.logs')}</TabsTrigger>
          <TabsTrigger value="costs">{t('projects:detail.tabs.costs')}</TabsTrigger>
          <TabsTrigger value="revenues">{t('projects:detail.tabs.revenues')}</TabsTrigger>
          <TabsTrigger value="summary">{t('projects:detail.tabs.summary')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SurfaceSection
            eyebrow={t('projects:detail.sections.general.eyebrow')}
            title={t('projects:detail.sections.general.title')}
            description={t('projects:detail.sections.general.description')}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-brand-sand/12 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.client')}
                </span>
                <p className="mt-1 font-medium">{project.clientName ?? t('common:emptyValue')}</p>
              </div>
              <div className="rounded-2xl bg-brand-sky/10 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.status')}
                </span>
                <div className="mt-2"><StatusBadge status={project.status} /></div>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.location')}
                </span>
                <p className="mt-1 font-medium">{project.location ?? t('common:emptyValue')}</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.contractAmount')}
                </span>
                <p className="mt-1 font-medium">
                  {project.contractAmount != null
                    ? formatCurrency(project.contractAmount, locale)
                    : t('common:emptyValue')}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.startDate')}
                </span>
                <p className="mt-1 font-medium">{formatDate(project.startDate, locale)}</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.endDate')}
                </span>
                <p className="mt-1 font-medium">{formatDate(project.endDate, locale)}</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 md:col-span-2">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.description')}
                </span>
                <p className="mt-1 font-medium">{project.description ?? t('common:emptyValue')}</p>
              </div>
            </div>
          </SurfaceSection>
        </TabsContent>

        <TabsContent value="logs">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => navigate('/daily-logs/new')}>
              {t('projects:detail.actions.newLog')}
            </Button>
          </div>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('projects:detail.empty.logs')}</p>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'date',
                  label: t('projects:columns.date'),
                  render: (row: DailyLogWithRelations) => formatDate(row.date, locale),
                },
                {
                  key: 'machineName',
                  label: t('projects:columns.machine'),
                  render: (row: DailyLogWithRelations) => row.machineName ?? t('common:emptyValue'),
                },
                {
                  key: 'operatorName',
                  label: t('projects:columns.operator'),
                  render: (row: DailyLogWithRelations) => row.operatorName ?? t('common:emptyValue'),
                },
                {
                  key: 'hoursWorked',
                  label: t('projects:columns.hours'),
                  render: (row: DailyLogWithRelations) => String(row.hoursWorked),
                },
                {
                  key: 'workDescription',
                  label: t('projects:columns.workDescription'),
                  render: (row: DailyLogWithRelations) =>
                    row.workDescription ?? t('common:emptyValue'),
                },
                { key: 'actions', label: t('projects:columns.actions'), render: (row: DailyLogWithRelations) => (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/daily-logs/${row.id}/edit`)}>
                    {t('common:edit')}
                  </Button>
                )},
              ]}
              data={logs}
            />
          )}
        </TabsContent>

        <TabsContent value="costs">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => navigate('/costs/new')}>
              {t('projects:detail.actions.newCost')}
            </Button>
          </div>
          {costs.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('projects:detail.empty.costs')}</p>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'date',
                  label: t('projects:columns.date'),
                  render: (row: ProjectCostWithRelations) => formatDate(row.date, locale),
                },
                {
                  key: 'category',
                  label: t('projects:columns.category'),
                  render: (row: ProjectCostWithRelations) => getCategoryLabel(row.category),
                },
                {
                  key: 'description',
                  label: t('projects:columns.description'),
                  render: (row: ProjectCostWithRelations) =>
                    row.description ?? t('common:emptyValue'),
                },
                {
                  key: 'amount',
                  label: t('projects:columns.amount'),
                  render: (row: ProjectCostWithRelations) =>
                    formatCurrency(Number(row.amount), locale),
                },
                { key: 'actions', label: t('projects:columns.actions'), render: (row: ProjectCostWithRelations) => (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/costs/${row.id}/edit`)}>
                    {t('common:edit')}
                  </Button>
                )},
              ]}
              data={costs}
            />
          )}
        </TabsContent>

        <TabsContent value="revenues">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => navigate('/revenues/new')}>
              {t('projects:detail.actions.newRevenue')}
            </Button>
          </div>
          {revenues.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('projects:detail.empty.revenues')}</p>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'date',
                  label: t('projects:columns.date'),
                  render: (row: ProjectRevenueWithRelations) => formatDate(row.date, locale),
                },
                {
                  key: 'description',
                  label: t('projects:columns.description'),
                  render: (row: ProjectRevenueWithRelations) =>
                    row.description ?? t('common:emptyValue'),
                },
                {
                  key: 'amount',
                  label: t('projects:columns.amount'),
                  render: (row: ProjectRevenueWithRelations) =>
                    formatCurrency(Number(row.amount), locale),
                },
                {
                  key: 'status',
                  label: t('projects:columns.status'),
                  render: (row: ProjectRevenueWithRelations) => (
                    <StatusBadge status={row.status} namespace="revenues" labelKeyPrefix="statuses" />
                  ),
                },
                { key: 'actions', label: t('projects:columns.actions'), render: (row: ProjectRevenueWithRelations) => (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/revenues/${row.id}/edit`)}>
                    {t('common:edit')}
                  </Button>
                )},
              ]}
              data={revenues}
            />
          )}
        </TabsContent>

        <TabsContent value="summary">
          <SurfaceSection
            eyebrow={t('projects:detail.sections.summary.eyebrow')}
            title={t('projects:detail.sections.summary.title')}
            description={t('projects:detail.sections.summary.description')}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-brand-orange/12 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.totalCosts')}
                </span>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(summary.totalCosts, locale)}
                </p>
              </div>
              <div className="rounded-2xl bg-brand-sky/12 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.totalRevenues')}
                </span>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(summary.totalRevenues, locale)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.profit')}
                </span>
                <p className={`mt-1 text-lg font-semibold ${summary.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(summary.profit, locale)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <span className="text-sm text-muted-foreground">
                  {t('projects:detail.fields.totalHours')}
                </span>
                <p className="mt-1 text-lg font-semibold">{formatHoursValue(summary.totalHours)}</p>
              </div>
            </div>
          </SurfaceSection>
        </TabsContent>
      </Tabs>
    </div>
  )
}
