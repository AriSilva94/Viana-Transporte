import { describe, expect, it, vi } from 'vitest'
import { createUserManagementService } from '../user-management-service'
import type { AuthRole, AuthState, UserAccessStatus } from '../../../shared/types'

function createAuthState(
  role: AuthRole,
  userId = 'admin-user',
  status: UserAccessStatus = 'active'
): AuthState {
  return {
    session: null,
    profile: {
      id: userId,
      email: `${userId}@test.com`,
      role,
      status,
    },
    pendingPasswordReset: false,
  }
}

function createProfile(overrides: Partial<{
  id: string
  email: string
  role: AuthRole
  status: UserAccessStatus
  created_at: string
}> = {}) {
  return {
    id: 'target-user',
    email: 'target@test.com',
    role: 'employee' as AuthRole,
    status: 'active' as UserAccessStatus,
    created_at: '2026-04-02T10:00:00.000Z',
    ...overrides,
  }
}

describe('createUserManagementService', () => {
  it('lists all profiles with status for admin callers', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin')),
      },
      repository: {
        listProfiles: vi.fn().mockResolvedValue([
          createProfile({
            id: 'user-1',
            email: 'admin@test.com',
            role: 'admin',
            status: 'active',
            created_at: '2026-04-01T10:00:00.000Z',
          }),
          createProfile({
            id: 'user-2',
            email: 'worker@test.com',
            role: 'employee',
            status: 'revoked',
          }),
        ]),
        getProfileById: vi.fn(),
        countActiveAdmins: vi.fn(),
        updateRole: vi.fn(),
        updateStatus: vi.fn(),
      },
    })

    await expect(service.listProfiles()).resolves.toEqual([
      {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        status: 'active',
        createdAt: '2026-04-01T10:00:00.000Z',
      },
      {
        id: 'user-2',
        email: 'worker@test.com',
        role: 'employee',
        status: 'revoked',
        createdAt: '2026-04-02T10:00:00.000Z',
      },
    ])
  })

  it('allows owners to update roles', async () => {
    const updateRole = vi.fn().mockResolvedValue(undefined)
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('owner', 'owner-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(createProfile()),
        countActiveAdmins: vi.fn(),
        updateRole,
        updateStatus: vi.fn(),
      },
    })

    await service.updateRole('target-user', 'owner')

    expect(updateRole).toHaveBeenCalledWith('target-user', 'owner', expect.any(String))
  })

  it('rejects role updates from non-admin and non-owner callers', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('employee', 'employee-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn(),
        countActiveAdmins: vi.fn(),
        updateRole: vi.fn(),
        updateStatus: vi.fn(),
      },
    })

    await expect(service.updateRole('target-user', 'employee')).rejects.toThrow(
      'Unauthorized: admin or owner access required'
    )
  })

  it('rejects when caller tries to change their own role', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin', 'admin-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(
          createProfile({
            id: 'admin-user',
            email: 'admin@test.com',
            role: 'admin',
          })
        ),
        countActiveAdmins: vi.fn(),
        updateRole: vi.fn(),
        updateStatus: vi.fn(),
      },
    })

    await expect(service.updateRole('admin-user', 'owner')).rejects.toThrow(
      'You cannot change your own role'
    )
  })

  it('rejects when demoting the last active admin', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin', 'caller-admin')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(
          createProfile({
            id: 'target-admin',
            role: 'admin',
            status: 'active',
          })
        ),
        countActiveAdmins: vi.fn().mockResolvedValue(1),
        updateRole: vi.fn(),
        updateStatus: vi.fn(),
      },
    })

    await expect(service.updateRole('target-admin', 'owner')).rejects.toThrow(
      'At least one admin must remain in the system'
    )
  })

  it('does not block demoting a revoked admin', async () => {
    const updateRole = vi.fn().mockResolvedValue(undefined)
    const countActiveAdmins = vi.fn()
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('owner', 'owner-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(
          createProfile({
            id: 'revoked-admin',
            role: 'admin',
            status: 'revoked',
          })
        ),
        countActiveAdmins,
        updateRole,
        updateStatus: vi.fn(),
      },
    })

    await service.updateRole('revoked-admin', 'employee')

    expect(countActiveAdmins).not.toHaveBeenCalled()
    expect(updateRole).toHaveBeenCalledWith('revoked-admin', 'employee', expect.any(String))
  })

  it('revokes access when admin rules are satisfied', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined)
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('owner', 'owner-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(createProfile()),
        countActiveAdmins: vi.fn(),
        updateRole: vi.fn(),
        updateStatus,
      },
    })

    await service.revokeAccess('target-user')

    expect(updateStatus).toHaveBeenCalledWith('target-user', 'revoked', expect.any(String))
  })

  it('rejects when caller tries to revoke their own access', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin', 'admin-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(
          createProfile({
            id: 'admin-user',
            role: 'admin',
          })
        ),
        countActiveAdmins: vi.fn(),
        updateRole: vi.fn(),
        updateStatus: vi.fn(),
      },
    })

    await expect(service.revokeAccess('admin-user')).rejects.toThrow(
      'You cannot revoke your own access'
    )
  })

  it('rejects revoking the last active admin', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('owner', 'owner-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(
          createProfile({
            id: 'target-admin',
            role: 'admin',
            status: 'active',
          })
        ),
        countActiveAdmins: vi.fn().mockResolvedValue(1),
        updateRole: vi.fn(),
        updateStatus: vi.fn(),
      },
    })

    await expect(service.revokeAccess('target-admin')).rejects.toThrow(
      'At least one admin must remain in the system'
    )
  })

  it('does not recount admins when revoking an already revoked admin', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined)
    const countActiveAdmins = vi.fn()
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin', 'caller-admin')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(
          createProfile({
            id: 'target-admin',
            role: 'admin',
            status: 'revoked',
          })
        ),
        countActiveAdmins,
        updateRole: vi.fn(),
        updateStatus,
      },
    })

    await service.revokeAccess('target-admin')

    expect(countActiveAdmins).not.toHaveBeenCalled()
    expect(updateStatus).toHaveBeenCalledWith('target-admin', 'revoked', expect.any(String))
  })

  it('reactivates access for a revoked user', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined)
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin', 'caller-admin')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(
          createProfile({
            id: 'target-user',
            status: 'revoked',
          })
        ),
        countActiveAdmins: vi.fn(),
        updateRole: vi.fn(),
        updateStatus,
      },
    })

    await service.reactivateAccess('target-user')

    expect(updateStatus).toHaveBeenCalledWith('target-user', 'active', expect.any(String))
  })

  it('rejects when caller tries to reactivate their own access', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('owner', 'owner-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue(
          createProfile({
            id: 'owner-user',
            role: 'owner',
            status: 'revoked',
          })
        ),
        countActiveAdmins: vi.fn(),
        updateRole: vi.fn(),
        updateStatus: vi.fn(),
      },
    })

    await expect(service.reactivateAccess('owner-user')).rejects.toThrow(
      'You cannot reactivate your own access'
    )
  })
})
