import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { formatDate } from '@renderer/lib/format'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { SurfaceSection } from '@renderer/components/shared/SurfaceSection'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Machine, DailyLogWithRelations, SupportedLocale } from '../../../shared/types'

export function MachineDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['machines', 'common'])
  const { id } = useParams<{ id: string }>()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([])
  const locale = i18n.language as SupportedLocale

  useEffect(() => {
    const numId = Number(id)
    api.machines.get(numId).then(setMachine)
    api.dailylogs.list({ machineId: numId }).then(setLogs)
  }, [id])

  if (!machine) {
    return <div className="text-muted-foreground">{t('common:loading')}</div>
  }

  const logColumns = [
    {
      key: 'date',
      label: t('machines:columns.date'),
      render: (row: DailyLogWithRelations) => formatDate(row.date, locale),
    },
    {
      key: 'projectName',
      label: t('machines:columns.project'),
      render: (row: DailyLogWithRelations) => row.projectName ?? t('common:emptyValue'),
    },
    {
      key: 'operatorName',
      label: t('machines:columns.operator'),
      render: (row: DailyLogWithRelations) => row.operatorName ?? t('common:emptyValue'),
    },
    {
      key: 'hoursWorked',
      label: t('machines:columns.hours'),
      render: (row: DailyLogWithRelations) => String(row.hoursWorked),
    },
    {
      key: 'workDescription',
      label: t('machines:columns.workDescription'),
      render: (row: DailyLogWithRelations) => row.workDescription ?? t('common:emptyValue'),
    },
  ]

  return (
    <div>
      <PageHeader
        title={machine.name}
        action={{
          label: t('machines:detail.editAction'),
          onClick: () => navigate(`/machines/${id}/edit`),
        }}
      />
      <div className="space-y-6">
        <SurfaceSection
          eyebrow={t('machines:detail.sections.machine.eyebrow')}
          title={t('machines:detail.sections.machine.title')}
          description={t('machines:detail.sections.machine.description')}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-brand-sand/12 p-4">
              <span className="text-sm text-muted-foreground">
                {t('machines:detail.fields.type')}
              </span>
              <p className="mt-1 font-medium">{machine.type}</p>
            </div>
            <div className="rounded-2xl bg-brand-sky/10 p-4">
              <span className="text-sm text-muted-foreground">
                {t('machines:detail.fields.identifier')}
              </span>
              <p className="mt-1 font-medium">{machine.identifier ?? t('common:emptyValue')}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <span className="text-sm text-muted-foreground">
                {t('machines:detail.fields.brandModel')}
              </span>
              <p className="mt-1 font-medium">{machine.brandModel ?? t('common:emptyValue')}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <span className="text-sm text-muted-foreground">
                {t('machines:detail.fields.status')}
              </span>
              <p className="mt-1 font-medium">
                <StatusBadge status={machine.status} />
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 md:col-span-2">
              <span className="text-sm text-muted-foreground">
                {t('machines:detail.fields.notes')}
              </span>
              <p className="mt-1 font-medium">{machine.notes ?? t('common:emptyValue')}</p>
            </div>
          </div>
        </SurfaceSection>

        <SurfaceSection
          eyebrow={t('machines:detail.sections.history.eyebrow')}
          title={t('machines:detail.sections.history.title')}
          description={t('machines:detail.sections.history.description')}
        >
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('machines:detail.emptyLogs')}</p>
          ) : (
            <DataTable columns={logColumns} data={logs} />
          )}
        </SurfaceSection>
      </div>
    </div>
  )
}
