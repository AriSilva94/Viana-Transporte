import { describe, expect, it, vi } from 'vitest'
import { createUserManagementService } from '../user-management-service'
import type { AuthRole, AuthState } from '../../../shared/types'

function createAuthState(role: AuthRole, userId = 'admin-user'): AuthState {
  return {
    session: null,
    profile: {
      id: userId,
      email: `${userId}@test.com`,
      role,
    },
    pendingPasswordReset: false,
  }
}

describe('createUserManagementService', () => {
  it('lists all profiles for admin callers', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin')),
      },
      repository: {
        listProfiles: vi.fn().mockResolvedValue([
          {
            id: 'user-1',
            email: 'admin@test.com',
            role: 'admin',
            created_at: '2026-04-01T10:00:00.000Z',
          },
          {
            id: 'user-2',
            email: 'worker@test.com',
            role: 'employee',
            created_at: '2026-04-02T10:00:00.000Z',
          },
        ]),
        getProfileById: vi.fn(),
        countAdmins: vi.fn(),
        updateRole: vi.fn(),
      },
    })

    await expect(service.listProfiles()).resolves.toEqual([
      {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        createdAt: '2026-04-01T10:00:00.000Z',
      },
      {
        id: 'user-2',
        email: 'worker@test.com',
        role: 'employee',
        createdAt: '2026-04-02T10:00:00.000Z',
      },
    ])
  })

  it('rejects role updates from non-admin callers', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('owner', 'owner-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn(),
        countAdmins: vi.fn(),
        updateRole: vi.fn(),
      },
    })

    await expect(service.updateRole('target-user', 'employee')).rejects.toThrow(
      'Unauthorized: admin access required'
    )
  })

  it('rejects when admin tries to change their own role', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin', 'admin-user')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue({
          id: 'admin-user',
          email: 'admin@test.com',
          role: 'admin',
          created_at: '2026-04-01T10:00:00.000Z',
        }),
        countAdmins: vi.fn(),
        updateRole: vi.fn(),
      },
    })

    await expect(service.updateRole('admin-user', 'owner')).rejects.toThrow(
      'You cannot change your own role'
    )
  })

  it('rejects when demoting the last admin', async () => {
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin', 'caller-admin')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue({
          id: 'target-admin',
          email: 'target@test.com',
          role: 'admin',
          created_at: '2026-04-01T10:00:00.000Z',
        }),
        countAdmins: vi.fn().mockResolvedValue(1),
        updateRole: vi.fn(),
      },
    })

    await expect(service.updateRole('target-admin', 'owner')).rejects.toThrow(
      'At least one admin must remain in the system'
    )
  })

  it('updates a role when admin rules are satisfied', async () => {
    const updateRole = vi.fn().mockResolvedValue(undefined)
    const service = createUserManagementService({
      authService: {
        getState: vi.fn().mockResolvedValue(createAuthState('admin', 'caller-admin')),
      },
      repository: {
        listProfiles: vi.fn(),
        getProfileById: vi.fn().mockResolvedValue({
          id: 'target-user',
          email: 'worker@test.com',
          role: 'employee',
          created_at: '2026-04-02T10:00:00.000Z',
        }),
        countAdmins: vi.fn(),
        updateRole,
      },
    })

    await service.updateRole('target-user', 'owner')

    expect(updateRole).toHaveBeenCalledWith('target-user', 'owner', expect.any(String))
  })
})
