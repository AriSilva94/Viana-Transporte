import type { AuthRole, AuthState, UserAccessStatus } from '../../shared/types'
import { createSupabaseClientFromEnv, type SupabaseClientBootstrap } from '../data/supabase/client'

export interface ProfileListItem {
  id: string
  email: string
  role: AuthRole
  status: UserAccessStatus
  createdAt: string
}

interface SupabaseProfileRow {
  id: string
  email: string
  role: AuthRole
  status: UserAccessStatus
  created_at: string
}

interface ProfileRoleUpdate {
  role: AuthRole
  updated_at: string
}

interface ProfileStatusUpdate {
  status: UserAccessStatus
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
    eq: (column: string, value: AuthRole | UserAccessStatus) => {
      eq: (column: string, value: AuthRole | UserAccessStatus) => Promise<{
        count: number | null
        error: unknown | null
      }>
    }
  }
}

interface SupabaseUpdateRoleQuery {
  update: (values: ProfileRoleUpdate) => {
    eq: (column: string, value: string) => Promise<{
      error: unknown | null
    }>
  }
}

interface SupabaseUpdateStatusQuery {
  update: (values: ProfileStatusUpdate) => {
    eq: (column: string, value: string) => Promise<{
      error: unknown | null
    }>
  }
}

export interface UserManagementRepository {
  listProfiles: () => Promise<SupabaseProfileRow[]>
  getProfileById: (userId: string) => Promise<SupabaseProfileRow | null>
  countActiveAdmins: () => Promise<number>
  updateRole: (userId: string, role: AuthRole, updatedAt: string) => Promise<void>
  updateStatus: (userId: string, status: UserAccessStatus, updatedAt: string) => Promise<void>
}

export interface UserManagementService {
  listProfiles: () => Promise<ProfileListItem[]>
  updateRole: (targetUserId: string, newRole: AuthRole) => Promise<void>
  revokeAccess: (targetUserId: string) => Promise<void>
  reactivateAccess: (targetUserId: string) => Promise<void>
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

async function requireAdminOrOwnerCaller(authService: UserManagementServiceDependencies['authService']) {
  const state = await authService.getState()
  const profile = state.profile

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    throw new Error('Unauthorized: admin or owner access required')
  }

  return profile
}

export function createUserManagementService(
  deps: UserManagementServiceDependencies
): UserManagementService {
  async function getManagedProfile(targetUserId: string) {
    const caller = await requireAdminOrOwnerCaller(deps.authService)
    const targetProfile = await deps.repository.getProfileById(targetUserId)

    if (!targetProfile) {
      throw new Error('User not found')
    }

    return { caller, targetProfile }
  }

  return {
    async listProfiles() {
      await requireAdminOrOwnerCaller(deps.authService)
      const profiles = await deps.repository.listProfiles()

      return profiles.map((profile) => ({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        createdAt: profile.created_at,
      }))
    },

    async updateRole(targetUserId, newRole) {
      const { caller, targetProfile } = await getManagedProfile(targetUserId)

      if (caller.id === targetUserId) {
        throw new Error('You cannot change your own role')
      }

      if (targetProfile.role === 'admin' && targetProfile.status === 'active' && newRole !== 'admin') {
        const adminCount = await deps.repository.countActiveAdmins()
        if (adminCount <= 1) {
          throw new Error('At least one admin must remain in the system')
        }
      }

      await deps.repository.updateRole(targetUserId, newRole, new Date().toISOString())
    },

    async revokeAccess(targetUserId) {
      const { caller, targetProfile } = await getManagedProfile(targetUserId)

      if (caller.id === targetUserId) {
        throw new Error('You cannot revoke your own access')
      }

      if (targetProfile.role === 'admin' && targetProfile.status === 'active') {
        const adminCount = await deps.repository.countActiveAdmins()
        if (adminCount <= 1) {
          throw new Error('At least one admin must remain in the system')
        }
      }

      await deps.repository.updateStatus(targetUserId, 'revoked', new Date().toISOString())
    },

    async reactivateAccess(targetUserId) {
      const { caller } = await getManagedProfile(targetUserId)

      if (caller.id === targetUserId) {
        throw new Error('You cannot reactivate your own access')
      }

      await deps.repository.updateStatus(targetUserId, 'active', new Date().toISOString())
    },
  }
}

export function createUserManagementRepositoryFromSupabaseClient(
  client: Pick<SupabaseClientBootstrap, 'from'>
): UserManagementRepository {
  return {
    async listProfiles() {
      const profiles = client.from('profiles') as SupabaseListProfilesQuery
      const result = await profiles.select('id,email,role,status,created_at').order('created_at', {
        ascending: true,
      })

      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Failed to load profiles'))
      }

      return result.data ?? []
    },

    async getProfileById(userId) {
      const profiles = client.from('profiles') as SupabaseGetProfileQuery
      const result = await profiles
        .select('id,email,role,status,created_at')
        .eq('id', userId)
        .maybeSingle()

      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Failed to load target profile'))
      }

      return result.data
    },

    async countActiveAdmins() {
      const profiles = client.from('profiles') as SupabaseCountAdminsQuery
      const result = await profiles
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('status', 'active')

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

    async updateStatus(userId, status, updatedAt) {
      const profiles = client.from('profiles') as SupabaseUpdateStatusQuery
      const result = await profiles.update({ status, updated_at: updatedAt }).eq('id', userId)

      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Failed to update user access'))
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
