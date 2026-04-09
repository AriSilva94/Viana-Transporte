import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { formatDate } from '@renderer/lib/format'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { SurfaceSection } from '@renderer/components/shared/SurfaceSection'
import { DetailPageSkeleton } from '@renderer/components/shared/DetailPageSkeleton'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Operator, DailyLogWithRelations, SupportedLocale } from '../../../shared/types'

export function OperatorDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['operators', 'common'])
  const { id } = useParams<{ id: string }>()
  const [operator, setOperator] = useState<Operator | null>(null)
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([])
  const locale = i18n.language as SupportedLocale

  useEffect(() => {
    const numId = Number(id)
    api.operators.get(numId).then(setOperator)
    api.dailylogs.list({ operatorId: numId }).then(setLogs)
  }, [id])

  if (!operator) {
    return <DetailPageSkeleton />
  }

  const logColumns = [
    {
      key: 'date',
      label: t('operators:columns.date'),
      render: (row: DailyLogWithRelations) => formatDate(row.date, locale),
    },
    {
      key: 'projectName',
      label: t('operators:columns.project'),
      render: (row: DailyLogWithRelations) => row.projectName ?? t('common:emptyValue'),
    },
    {
      key: 'machineName',
      label: t('operators:columns.machine'),
      render: (row: DailyLogWithRelations) => row.machineName ?? t('common:emptyValue'),
    },
    {
      key: 'hoursWorked',
      label: t('operators:columns.hours'),
      render: (row: DailyLogWithRelations) => String(row.hoursWorked),
    },
    {
      key: 'workDescription',
      label: t('operators:columns.workDescription'),
      render: (row: DailyLogWithRelations) => row.workDescription ?? t('common:emptyValue'),
    },
  ]

  return (
    <div>
      <PageHeader
        title={operator.name}
        action={{
          label: t('operators:detail.editAction'),
          onClick: () => navigate(`/operators/${id}/edit`),
        }}
      />
      <div className="space-y-6">
        <SurfaceSection
          eyebrow={t('operators:detail.sections.operator.eyebrow')}
          title={t('operators:detail.sections.operator.title')}
          description={t('operators:detail.sections.operator.description')}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-brand-sand/12 p-4">
              <span className="text-sm text-muted-foreground">
                {t('operators:detail.fields.phone')}
              </span>
              <p className="mt-1 font-medium">{operator.phone ?? t('common:emptyValue')}</p>
            </div>
            <div className="rounded-2xl bg-brand-sky/10 p-4">
              <span className="text-sm text-muted-foreground">
                {t('operators:detail.fields.role')}
              </span>
              <p className="mt-1 font-medium">{operator.role ?? t('common:emptyValue')}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <span className="text-sm text-muted-foreground">
                {t('operators:detail.fields.status')}
              </span>
              <p className="mt-1 font-medium">
                <StatusBadge status={operator.isActive ? 'active' : 'inactive'} />
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 md:col-span-2">
              <span className="text-sm text-muted-foreground">
                {t('operators:detail.fields.notes')}
              </span>
              <p className="mt-1 font-medium">{operator.notes ?? t('common:emptyValue')}</p>
            </div>
          </div>
        </SurfaceSection>

        <SurfaceSection
          eyebrow={t('operators:detail.sections.history.eyebrow')}
          title={t('operators:detail.sections.history.title')}
          description={t('operators:detail.sections.history.description')}
        >
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('operators:detail.emptyLogs')}</p>
          ) : (
            <DataTable columns={logColumns} data={logs} />
          )}
        </SurfaceSection>
      </div>
    </div>
  )
}
