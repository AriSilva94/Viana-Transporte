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
      },
    })

    await expect(service.getRequiredProfile('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'user@test.com',
      role: 'admin',
    })
  })
})
