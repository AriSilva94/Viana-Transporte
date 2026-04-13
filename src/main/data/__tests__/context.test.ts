import { describe, expect, it, vi } from 'vitest'
import { createDataContext } from '../context'

describe('createDataContext', () => {
  it('returns the current authenticated user id from auth state', async () => {
    const context = createDataContext({
      getAuthState: vi.fn().mockResolvedValue({
        session: {
          accessToken: 'token',
          refreshToken: 'refresh',
          userId: 'user-1',
          email: 'a@b.com',
          expiresAt: 123,
        },
        profile: {
          id: 'user-1',
          email: 'a@b.com',
          role: 'admin',
        },
        pendingPasswordReset: false,
      }),
    })

    await expect(context.getRequiredUserId()).resolves.toBe('user-1')
  })

  it('throws when no session exists', async () => {
    const context = createDataContext({
      getAuthState: vi.fn().mockResolvedValue({
        session: null,
        profile: null,
        pendingPasswordReset: false,
      }),
    })

    await expect(context.getRequiredUserId()).rejects.toThrow(
      'No authenticated user for protected data access'
    )
  })
})
