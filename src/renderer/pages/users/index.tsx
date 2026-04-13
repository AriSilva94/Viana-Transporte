import { useEffect, useState } from 'react'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { TableSkeleton } from '@renderer/components/shared/TableSkeleton'
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
  if (message.includes('at least one admin')) return t('lastAdminError')
  if (message.includes('unauthorized')) return t('unauthorized')

  return t('updateError')
}

export function UsersPage(): JSX.Element {
  const { t } = useTranslation('users')
  const { state } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<UserProfileListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  async function handleRoleChange(userId: string, role: AuthRole): Promise<void> {
    try {
      await api.users.updateRole(userId, role)
      await loadUsers()
      showToast(t('updateSuccess'))
    } catch (error) {
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
      render: (row: UserProfileListItem) => {
        if (row.id === currentUserId) {
          return (
            <Button
              size="sm"
              variant="outline"
              disabled
              data-testid={`user-role-action-${row.id}`}
            >
              {t('changeRole')}
            </Button>
          )
        }

        return (
          <select
            value={row.role}
            onChange={(event) => void handleRoleChange(row.id, event.target.value as AuthRole)}
            aria-label={t('changeRole')}
            className="min-w-[12rem] rounded-xl border border-input bg-white/85 px-3 py-2 text-sm shadow-sm outline-none transition-all duration-200 focus:border-secondary/45 focus:ring-2 focus:ring-brand-sky/18"
            data-testid={`user-role-select-${row.id}`}
          >
            <option value="admin">{t('roleAdmin')}</option>
            <option value="owner">{t('roleOwner')}</option>
            <option value="employee">{t('roleEmployee')}</option>
          </select>
        )
      },
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
    </div>
  )
}
