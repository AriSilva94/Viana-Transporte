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
import type { Operator } from '../../../shared/types'

export function OperatorsListPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['operators', 'common'])
  const [operators, setOperators] = useState<Operator[]>([])
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadOperators(q?: string): Promise<void> {
    setIsLoading(true)
    try {
      const data = await api.operators.list(q ? { search: q } : undefined)
      setOperators(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOperators()
  }, [])

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.operators.delete(deleteId)
    setDeleteId(null)
    loadOperators(search)
  }

  const columns = [
    { key: 'name', label: t('operators:columns.name') },
    {
      key: 'phone',
      label: t('operators:columns.phone'),
      render: (row: Operator) => row.phone ?? t('common:emptyValue'),
    },
    {
      key: 'role',
      label: t('operators:columns.role'),
      render: (row: Operator) => row.role ?? t('common:emptyValue'),
    },
    {
      key: 'isActive',
      label: t('operators:columns.isActive'),
      render: (row: Operator) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      label: t('operators:columns.actions'),
      render: (row: Operator) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/operators/${row.id}`)}>
            {t('common:view')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/operators/${row.id}/edit`)}>
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
    <div>
      <PageHeader
        title={t('operators:title')}
        action={{ label: t('operators:newAction'), onClick: () => navigate('/operators/new') }}
      />
      {isLoading ? (
        <div className="text-muted-foreground text-sm">{t('common:loading')}</div>
      ) : operators.length === 0 && !search ? (
        <EmptyState
          message={t('operators:empty')}
          action={{
            label: t('operators:createFirst'),
            onClick: () => navigate('/operators/new'),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={operators}
          onSearch={(q) => { setSearch(q); loadOperators(q) }}
          searchPlaceholder={t('operators:searchPlaceholder')}
        />
      )}
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title={t('operators:deleteDialog.title')}
        description={t('operators:deleteDialog.description')}
      />
    </div>
  )
}
