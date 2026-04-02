import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { formatCurrency } from '@renderer/lib/format'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { SurfaceSection } from '@renderer/components/shared/SurfaceSection'
import { Button } from '@renderer/components/ui/button'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Client, ProjectWithClient, SupportedLocale } from '../../../shared/types'

export function ClientDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['clients', 'common'])
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const locale = i18n.language as SupportedLocale

  useEffect(() => {
    const numId = Number(id)
    api.clients.get(numId).then(setClient)
    api.projects.list({ clientId: numId }).then(setProjects)
  }, [id])

  if (!client) {
    return <div className="text-muted-foreground">{t('common:loading')}</div>
  }

  const projectColumns = [
    { key: 'name', label: t('clients:columns.name') },
    {
      key: 'status',
      label: t('clients:columns.status'),
      render: (row: ProjectWithClient) => <StatusBadge status={row.status} />,
    },
    {
      key: 'contractAmount',
      label: t('clients:columns.contractAmount'),
      render: (row: ProjectWithClient) =>
        row.contractAmount != null
          ? formatCurrency(row.contractAmount, locale)
          : t('common:emptyValue'),
    },
    {
      key: 'link',
      label: '',
      render: (row: ProjectWithClient) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/projects/${row.id}`)}
        >
          {t('common:view')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={client.name}
        action={{
          label: t('clients:detail.editAction'),
          onClick: () => navigate(`/clients/${id}/edit`),
        }}
      />
      <div className="space-y-6">
        <SurfaceSection
          eyebrow={t('clients:detail.sections.profile.eyebrow')}
          title={t('clients:detail.sections.profile.title')}
          description={t('clients:detail.sections.profile.description')}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-brand-sand/12 p-4">
              <span className="text-sm text-muted-foreground">
                {t('clients:detail.fields.document')}
              </span>
              <p className="mt-1 font-medium">{client.document ?? t('common:emptyValue')}</p>
            </div>
            <div className="rounded-2xl bg-brand-sky/10 p-4">
              <span className="text-sm text-muted-foreground">
                {t('clients:detail.fields.phone')}
              </span>
              <p className="mt-1 font-medium">{client.phone ?? t('common:emptyValue')}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <span className="text-sm text-muted-foreground">
                {t('clients:detail.fields.email')}
              </span>
              <p className="mt-1 font-medium">{client.email ?? t('common:emptyValue')}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 md:col-span-2">
              <span className="text-sm text-muted-foreground">
                {t('clients:detail.fields.notes')}
              </span>
              <p className="mt-1 font-medium">{client.notes ?? t('common:emptyValue')}</p>
            </div>
          </div>
        </SurfaceSection>

        <SurfaceSection
          eyebrow={t('clients:detail.sections.projects.eyebrow')}
          title={t('clients:detail.sections.projects.title')}
          description={t('clients:detail.sections.projects.description')}
        >
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('clients:detail.emptyProjects')}</p>
          ) : (
            <DataTable columns={projectColumns} data={projects} />
          )}
        </SurfaceSection>
      </div>
    </div>
  )
}
