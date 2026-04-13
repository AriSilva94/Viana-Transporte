import { describe, expect, it, vi } from 'vitest'
import { createProfileService } from '../profile-service'

describe('createProfileService', () => {
  it('returns the persisted profile for the authenticated user', async () => {
    const service = createProfileService({
      profiles: {
        getByUserId: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@test.com',
          role: 'admin',
        }),
        create: vi.fn(),
      },
    })

    await expect(service.getRequiredProfile('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'user@test.com',
      role: 'admin',
    })
  })

  it('ensureProfile returns existing profile without creating', async () => {
    const create = vi.fn()
    const service = createProfileService({
      profiles: {
        getByUserId: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'admin@test.com',
          role: 'admin',
        }),
        create,
      },
    })

    const profile = await service.ensureProfile('user-1', 'admin@test.com')
    expect(profile.role).toBe('admin')
    expect(create).not.toHaveBeenCalled()
  })

  it('ensureProfile creates employee profile for new user', async () => {
    const create = vi.fn()
    const service = createProfileService({
      profiles: {
        getByUserId: vi.fn().mockResolvedValue(null),
        create,
      },
    })

    const profile = await service.ensureProfile('user-2', 'new@test.com')
    expect(profile).toEqual({
      id: 'user-2',
      email: 'new@test.com',
      role: 'employee',
    })
    expect(create).toHaveBeenCalledWith({
      id: 'user-2',
      email: 'new@test.com',
      role: 'employee',
    })
  })
})
