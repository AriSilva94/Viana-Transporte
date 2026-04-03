import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { formatCurrency } from '@renderer/lib/format'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { FilterPanel } from '@renderer/components/shared/FilterPanel'
import { Button } from '@renderer/components/ui/button'
import { Select } from '@renderer/components/ui/select'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Project, ProjectWithClient, SupportedLocale } from '../../../shared/types'

export function ProjectsListPage(): JSX.Element {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['projects', 'common'])
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Project['status'] | ''>('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const locale = i18n.language as SupportedLocale

  async function loadProjects(q?: string, s?: Project['status'] | ''): Promise<void> {
    setIsLoading(true)
    try {
      const filters: Record<string, unknown> = {}
      if (q) filters.search = q
      if (s) filters.status = s
      const data = await api.projects.list(
        Object.keys(filters).length ? (filters as Parameters<typeof api.projects.list>[0]) : undefined
      )
      setProjects(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.projects.delete(deleteId)
    setDeleteId(null)
    loadProjects(search, status)
  }

  const columns = [
    { key: 'name', label: t('projects:columns.name') },
    {
      key: 'clientName',
      label: t('projects:columns.client'),
      render: (row: ProjectWithClient) => row.clientName ?? t('common:emptyValue'),
    },
    {
      key: 'location',
      label: t('projects:columns.location'),
      render: (row: ProjectWithClient) => row.location ?? t('common:emptyValue'),
    },
    {
      key: 'status',
      label: t('projects:columns.status'),
      render: (row: ProjectWithClient) => <StatusBadge status={row.status} />,
    },
    {
      key: 'contractAmount',
      label: t('projects:columns.contractAmount'),
      render: (row: ProjectWithClient) =>
        row.contractAmount != null
          ? formatCurrency(row.contractAmount, locale)
          : t('common:emptyValue'),
    },
    {
      key: 'actions',
      label: t('projects:columns.actions'),
      render: (row: ProjectWithClient) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${row.id}`)}>
            {t('common:view')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${row.id}/edit`)}>
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
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('projects:title')}
        action={{ label: t('projects:newAction'), onClick: () => navigate('/projects/new') }}
      />
      <FilterPanel>
        <Select
          value={status}
          onChange={(e) => {
            const val = e.target.value as Project['status'] | ''
            setStatus(val)
            loadProjects(search, val)
          }}
          className="w-48"
        >
          <option value="">{t('projects:filters.allStatuses')}</option>
          <option value="planned">{t('common:status.planned')}</option>
          <option value="active">{t('common:status.active')}</option>
          <option value="completed">{t('common:status.completed')}</option>
          <option value="canceled">{t('common:status.canceled')}</option>
        </Select>
      </FilterPanel>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">{t('common:loading')}</div>
        ) : projects.length === 0 ? (
          <EmptyState
            message={t('projects:empty')}
            action={{ label: t('projects:createFirst'), onClick: () => navigate('/projects/new') }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={projects}
            onSearch={(q) => { setSearch(q); loadProjects(q, status) }}
            searchPlaceholder={t('projects:searchPlaceholder')}
          />
        )}
      </div>
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title={t('projects:deleteDialog.title')}
        description={t('projects:deleteDialog.description')}
      />
    </div>
  )
}
