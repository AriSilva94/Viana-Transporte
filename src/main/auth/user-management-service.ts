import type { AuthRole, AuthState } from '../../shared/types'
import { createSupabaseClientFromEnv, type SupabaseClientBootstrap } from '../data/supabase/client'

export interface ProfileListItem {
  id: string
  email: string
  role: AuthRole
  createdAt: string
}

interface SupabaseProfileRow {
  id: string
  email: string
  role: AuthRole
  created_at: string
}

interface ProfileRoleUpdate {
  role: AuthRole
  updated_at: string
}

interface SupabaseListProfilesQuery {
  select: (columns: string) => {
    order: (column: string, options?: { ascending?: boolean }) => Promise<{
      data: SupabaseProfileRow[] | null
      error: unknown | null
    }>
  }
}

interface SupabaseGetProfileQuery {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{
        data: SupabaseProfileRow | null
        error: unknown | null
      }>
    }
  }
}

interface SupabaseCountAdminsQuery {
  select: (
    columns: string,
    options: { count: 'exact'; head: true }
  ) => {
    eq: (column: string, value: AuthRole) => Promise<{
      count: number | null
      error: unknown | null
    }>
  }
}

interface SupabaseUpdateRoleQuery {
  update: (values: ProfileRoleUpdate) => {
    eq: (column: string, value: string) => Promise<{
      error: unknown | null
    }>
  }
}

export interface UserManagementRepository {
  listProfiles: () => Promise<SupabaseProfileRow[]>
  getProfileById: (userId: string) => Promise<SupabaseProfileRow | null>
  countAdmins: () => Promise<number>
  updateRole: (userId: string, role: AuthRole, updatedAt: string) => Promise<void>
}

export interface UserManagementService {
  listProfiles: () => Promise<ProfileListItem[]>
  updateRole: (targetUserId: string, newRole: AuthRole) => Promise<void>
}

export interface UserManagementServiceDependencies {
  authService: Pick<{ getState: () => Promise<AuthState> }, 'getState'>
  repository: UserManagementRepository
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallbackMessage
}

async function requireAdminCaller(authService: UserManagementServiceDependencies['authService']) {
  const state = await authService.getState()
  const profile = state.profile

  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized: admin access required')
  }

  return profile
}

export function createUserManagementService(
  deps: UserManagementServiceDependencies
): UserManagementService {
  return {
    async listProfiles() {
      await requireAdminCaller(deps.authService)
      const profiles = await deps.repository.listProfiles()

      return profiles.map((profile) => ({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        createdAt: profile.created_at,
      }))
    },

    async updateRole(targetUserId, newRole) {
      const caller = await requireAdminCaller(deps.authService)
      const targetProfile = await deps.repository.getProfileById(targetUserId)

      if (!targetProfile) {
        throw new Error('User not found')
      }

      if (caller.id === targetUserId) {
        throw new Error('You cannot change your own role')
      }

      if (targetProfile.role === 'admin' && newRole !== 'admin') {
        const adminCount = await deps.repository.countAdmins()
        if (adminCount <= 1) {
          throw new Error('At least one admin must remain in the system')
        }
      }

      await deps.repository.updateRole(targetUserId, newRole, new Date().toISOString())
    },
  }
}

export function createUserManagementRepositoryFromSupabaseClient(
  client: Pick<SupabaseClientBootstrap, 'from'>
): UserManagementRepository {
  return {
    async listProfiles() {
      const profiles = client.from('profiles') as SupabaseListProfilesQuery
      const result = await profiles.select('id,email,role,created_at').order('created_at', {
        ascending: true,
      })

      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Failed to load profiles'))
      }

      return result.data ?? []
    },

    async getProfileById(userId) {
      const profiles = client.from('profiles') as SupabaseGetProfileQuery
      const result = await profiles.select('id,email,role,created_at').eq('id', userId).maybeSingle()

      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Failed to load target profile'))
      }

      return result.data
    },

    async countAdmins() {
      const profiles = client.from('profiles') as SupabaseCountAdminsQuery
      const result = await profiles.select('id', { count: 'exact', head: true }).eq('role', 'admin')

      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Failed to count admins'))
      }

      return result.count ?? 0
    },

    async updateRole(userId, role, updatedAt) {
      const profiles = client.from('profiles') as SupabaseUpdateRoleQuery
      const result = await profiles.update({ role, updated_at: updatedAt }).eq('id', userId)

      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Failed to update user role'))
      }
    },
  }
}

export async function createUserManagementServiceFromEnv(
  authService: UserManagementServiceDependencies['authService']
): Promise<UserManagementService> {
  const client = await createSupabaseClientFromEnv()
  return createUserManagementService({
    authService,
    repository: createUserManagementRepositoryFromSupabaseClient(client),
  })
}
