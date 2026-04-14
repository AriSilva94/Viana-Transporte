import { useEffect, useState } from 'react'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { TableSkeleton } from '@renderer/components/shared/TableSkeleton'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { useAuth } from '@renderer/context/AuthContext'
import { useToast } from '@renderer/context/ToastContext'
import { api } from '@renderer/lib/api'
import { formatDate } from '@renderer/lib/format'
import { useTranslation } from 'react-i18next'
import type { AuthRole, SupportedLocale, UserProfileListItem } from '../../../shared/types'

function getRoleLabel(role: AuthRole, t: (key: string) => string): string {
  if (role === 'admin') return t('roleAdmin')
  if (role === 'owner') return t('roleOwner')
  return t('roleEmployee')
}

function getRoleBadgeClass(role: AuthRole): string {
  if (role === 'admin') return 'bg-brand-deep text-white'
  if (role === 'owner') return 'bg-brand-sand/35 text-brand-ink'
  return 'bg-brand-sky/18 text-brand-deep'
}

function mapUsersErrorMessage(error: unknown, t: (key: string) => string): string {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('own role')) return t('cannotChangeSelf')
  if (message.includes('own account')) return t('cannotDeleteSelf')
  if (message.includes('at least one admin')) return t('lastAdminError')
  if (message.includes('unauthorized')) return t('unauthorized')

  return t('updateError')
}

export function UsersPage(): JSX.Element {
  const { t } = useTranslation('users')
  const { t: tc } = useTranslation('common')
  const { state } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<UserProfileListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewUser, setViewUser] = useState<UserProfileListItem | null>(null)
  const [editUser, setEditUser] = useState<UserProfileListItem | null>(null)
  const [editRole, setEditRole] = useState<AuthRole>('employee')
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

  async function handleRoleChange(): Promise<void> {
    if (!editUser) return
    try {
      await api.users.updateRole(editUser.id, editRole)
      setEditUser(null)
      await loadUsers()
      showToast(t('updateSuccess'))
    } catch (error) {
      showToast(mapUsersErrorMessage(error, t), 'error')
    }
  }

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
            onClick={() => setViewUser(row)}
          >
            {tc('view')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={row.id === currentUserId}
            onClick={() => {
              setEditUser(row)
              setEditRole(row.role)
            }}
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

      {/* View Dialog */}
      <Dialog open={viewUser !== null} onOpenChange={(open) => { if (!open) setViewUser(null) }}>
        <DialogHeader>
          <DialogTitle>{t('viewDialogTitle')}</DialogTitle>
        </DialogHeader>
        {viewUser && (
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground">{t('email')}</p>
              <p className="font-medium">{viewUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('role')}</p>
              <span
                className={`mt-1 inline-flex items-center rounded-full border border-black/5 px-2.5 py-1 text-xs font-medium shadow-sm ${getRoleBadgeClass(viewUser.role)}`}
              >
                {getRoleLabel(viewUser.role, t)}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('createdAt')}</p>
              <p className="font-medium">{formatDate(viewUser.createdAt, locale)}</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setViewUser(null)}>
            {tc('close')}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editUser !== null}
        onOpenChange={(open) => { if (!open) setEditUser(null) }}
      >
        <DialogHeader>
          <DialogTitle>{t('editDialogTitle')}</DialogTitle>
        </DialogHeader>
        {editUser && (
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground">{t('email')}</p>
              <p className="font-medium">{editUser.email}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground" htmlFor="edit-role-select">
                {t('role')}
              </label>
              <select
                id="edit-role-select"
                value={editRole}
                onChange={(event) => setEditRole(event.target.value as AuthRole)}
                className="w-full rounded-xl border border-input bg-white/85 px-3 py-2 text-sm shadow-sm outline-none transition-all duration-200 focus:border-secondary/45 focus:ring-2 focus:ring-brand-sky/18"
              >
                <option value="admin">{t('roleAdmin')}</option>
                <option value="owner">{t('roleOwner')}</option>
                <option value="employee">{t('roleEmployee')}</option>
              </select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditUser(null)}>
            {tc('cancel')}
          </Button>
          <Button onClick={() => void handleRoleChange()}>
            {tc('save')}
          </Button>
        </DialogFooter>
      </Dialog>

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
