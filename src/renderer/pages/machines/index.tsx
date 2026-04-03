import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { Button } from '@renderer/components/ui/button'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Machine } from '../../../shared/types'

export function MachinesListPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['machines', 'common'])
  const [machines, setMachines] = useState<Machine[]>([])
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadMachines(q?: string): Promise<void> {
    setIsLoading(true)
    try {
      const data = await api.machines.list(q ? { search: q } : undefined)
      setMachines(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMachines()
  }, [])

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.machines.delete(deleteId)
    setDeleteId(null)
    loadMachines(search)
  }

  const columns = [
    { key: 'name', label: t('machines:columns.name') },
    { key: 'type', label: t('machines:columns.type') },
    {
      key: 'identifier',
      label: t('machines:columns.identifier'),
      render: (row: Machine) => row.identifier ?? t('common:emptyValue'),
    },
    {
      key: 'brandModel',
      label: t('machines:columns.brandModel'),
      render: (row: Machine) => row.brandModel ?? t('common:emptyValue'),
    },
    {
      key: 'status',
      label: t('machines:columns.status'),
      render: (row: Machine) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: t('machines:columns.actions'),
      render: (row: Machine) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/machines/${row.id}`)}>
            {t('common:view')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/machines/${row.id}/edit`)}>
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
        title={t('machines:title')}
        action={{ label: t('machines:newAction'), onClick: () => navigate('/machines/new') }}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">{t('common:loading')}</div>
        ) : machines.length === 0 && !search ? (
          <EmptyState
            message={t('machines:empty')}
            action={{ label: t('machines:createFirst'), onClick: () => navigate('/machines/new') }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={machines}
            onSearch={(q) => { setSearch(q); loadMachines(q) }}
            searchPlaceholder={t('machines:searchPlaceholder')}
          />
        )}
      </div>
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title={t('machines:deleteDialog.title')}
        description={t('machines:deleteDialog.description')}
      />
    </div>
  )
}
