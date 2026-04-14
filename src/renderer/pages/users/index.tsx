import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { TableSkeleton } from '@renderer/components/shared/TableSkeleton'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { Button } from '@renderer/components/ui/button'
import { useAuth } from '@renderer/context/AuthContext'
import { useToast } from '@renderer/context/ToastContext'
import { api } from '@renderer/lib/api'
import { formatDate } from '@renderer/lib/format'
import { useTranslation } from 'react-i18next'
import { getRoleBadgeClass, getRoleLabel, mapUsersErrorMessage } from './userHelpers'
import type { SupportedLocale, UserProfileListItem } from '../../../shared/types'

export function UsersPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation('users')
  const { t: tc } = useTranslation('common')
  const { state } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<UserProfileListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function loadUsers(): Promise<void> {
    setIsLoading(true)
    try {
      const data = await api.users.list()
      setUsers(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    try {
      await api.users.delete(deleteId)
      setDeleteId(null)
      await loadUsers()
      showToast(t('deleteSuccess'))
    } catch (error) {
      setDeleteId(null)
      showToast(mapUsersErrorMessage(error, t), 'error')
    }
  }

  const currentUserId = state?.profile?.id ?? null
  const locale = (navigator.language || 'pt-BR') as SupportedLocale

  const columns = [
    {
      key: 'email',
      label: t('email'),
      render: (row: UserProfileListItem) => <span className="font-medium">{row.email}</span>,
    },
    {
      key: 'role',
      label: t('role'),
      render: (row: UserProfileListItem) => (
        <span
          className={`inline-flex items-center rounded-full border border-black/5 px-2.5 py-1 text-xs font-medium shadow-sm ${getRoleBadgeClass(row.role)}`}
        >
          {getRoleLabel(row.role, t)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: t('createdAt'),
      render: (row: UserProfileListItem) => formatDate(row.createdAt, locale),
    },
    {
      key: 'actions',
      label: t('actions'),
      render: (row: UserProfileListItem) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/users/${row.id}`)}
          >
            {tc('view')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={row.id === currentUserId}
            onClick={() => navigate(`/users/${row.id}/edit`)}
          >
            {tc('edit')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={row.id === currentUserId}
            onClick={() => setDeleteId(row.id)}
          >
            {tc('delete')}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('pageTitle')} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <TableSkeleton columns={4} />
        ) : users.length === 0 ? (
          <EmptyState message={t('emptyState')} />
        ) : (
          <DataTable columns={columns} data={users} />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteId(null)}
        title={t('deleteDialogTitle')}
        description={t('deleteDialogDescription')}
      />
    </div>
  )
}
