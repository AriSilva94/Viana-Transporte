import type { AuthRole, UserProfileListItem } from '../../../shared/types'

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

async function findUserById(userId: string): Promise<UserProfileListItem | null> {
  const users = await window.api.users.list()
  return users.find((user: UserProfileListItem) => user.id === userId) ?? null
}

export { findUserById, getRoleBadgeClass, getRoleLabel, mapUsersErrorMessage }
