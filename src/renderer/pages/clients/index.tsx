import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { Button } from '@renderer/components/ui/button'
import type { Client } from '../../../shared/types'

export function ClientsListPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['clients', 'common'])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadClients(q?: string): Promise<void> {
    setIsLoading(true)
    try {
      const data = await api.clients.list(q ? { search: q } : undefined)
      setClients(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.clients.delete(deleteId)
    setDeleteId(null)
    loadClients(search)
  }

  const columns = [
    { key: 'name', label: t('clients:columns.name') },
    {
      key: 'document',
      label: t('clients:columns.document'),
      render: (row: Client) => row.document ?? t('common:emptyValue'),
    },
    {
      key: 'phone',
      label: t('clients:columns.phone'),
      render: (row: Client) => row.phone ?? t('common:emptyValue'),
    },
    {
      key: 'email',
      label: t('clients:columns.email'),
      render: (row: Client) => row.email ?? t('common:emptyValue'),
    },
    {
      key: 'actions',
      label: t('clients:columns.actions'),
      render: (row: Client) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/clients/${row.id}`)}>
            {t('common:view')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/clients/${row.id}/edit`)}>
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
        title={t('clients:title')}
        action={{ label: t('clients:newAction'), onClick: () => navigate('/clients/new') }}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">{t('common:loading')}</div>
        ) : clients.length === 0 && !search ? (
          <EmptyState
            message={t('clients:empty')}
            action={{
              label: t('clients:createFirst'),
              onClick: () => navigate('/clients/new'),
            }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={clients}
            onSearch={(q) => {
              setSearch(q)
              loadClients(q)
            }}
            searchPlaceholder={t('clients:searchPlaceholder')}
          />
        )}
      </div>
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title={t('clients:deleteDialog.title')}
        description={t('clients:deleteDialog.description')}
      />
    </div>
  )
}
