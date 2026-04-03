import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

const { ipcHandleMock } = vi.hoisted(() => ({
  ipcHandleMock: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: ipcHandleMock,
  },
}))

import { createSupabaseAuthClientFromEnv } from '../client'
import { createAuthService } from '../service'

afterEach(() => {
  createClientMock.mockReset()
})

describe('createSupabaseAuthClientFromEnv', () => {
  it('throws when SUPABASE_URL is missing', async () => {
    const originalUrl = process.env.SUPABASE_URL
    const originalKey = process.env.SUPABASE_ANON_KEY

    try {
      delete process.env.SUPABASE_URL
      process.env.SUPABASE_ANON_KEY = 'test-anon-key'

      await expect(createSupabaseAuthClientFromEnv()).rejects.toThrow('Missing SUPABASE_URL')
    } finally {
      if (originalUrl === undefined) {
        delete process.env.SUPABASE_URL
      } else {
        process.env.SUPABASE_URL = originalUrl
      }

      if (originalKey === undefined) {
        delete process.env.SUPABASE_ANON_KEY
      } else {
        process.env.SUPABASE_ANON_KEY = originalKey
      }
    }
  })

  it('throws when SUPABASE_ANON_KEY is missing', async () => {
    const originalUrl = process.env.SUPABASE_URL
    const originalKey = process.env.SUPABASE_ANON_KEY

    try {
      process.env.SUPABASE_URL = 'https://example.supabase.co'
      delete process.env.SUPABASE_ANON_KEY

      await expect(createSupabaseAuthClientFromEnv()).rejects.toThrow('Missing SUPABASE_ANON_KEY')
    } finally {
      if (originalUrl === undefined) {
        delete process.env.SUPABASE_URL
      } else {
        process.env.SUPABASE_URL = originalUrl
      }

      if (originalKey === undefined) {
        delete process.env.SUPABASE_ANON_KEY
      } else {
        process.env.SUPABASE_ANON_KEY = originalKey
      }
    }
  })

  it('creates the auth client with env values and disabled session persistence', async () => {
    const originalUrl = process.env.SUPABASE_URL
    const originalKey = process.env.SUPABASE_ANON_KEY
    const fakeClient = { auth: { getSession: vi.fn() } }

    createClientMock.mockReturnValue(fakeClient)

    try {
      process.env.SUPABASE_URL = 'https://example.supabase.co'
      process.env.SUPABASE_ANON_KEY = 'test-anon-key'

      await expect(createSupabaseAuthClientFromEnv()).resolves.toBe(fakeClient)
      expect(createClientMock).toHaveBeenCalledWith('https://example.supabase.co', 'test-anon-key', {
        auth: {
          persistSession: false,
        },
      })
    } finally {
      if (originalUrl === undefined) {
        delete process.env.SUPABASE_URL
      } else {
        process.env.SUPABASE_URL = originalUrl
      }

      if (originalKey === undefined) {
        delete process.env.SUPABASE_ANON_KEY
      } else {
        process.env.SUPABASE_ANON_KEY = originalKey
      }
    }
  })
})

describe('createAuthService', () => {
  it('persists session after signIn and restores it in getState', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'mightyrept-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'access-token',
              refresh_token: 'refresh-token',
              user: {
                id: 'user-1',
                email: 'a@b.com',
              },
              expires_at: 123,
            },
          },
          error: null,
        }),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        signOut: vi.fn(),
      },
    }

    try {
      const service = await createAuthService({ authClient, userDataPath })

      await service.signIn({ email: 'a@b.com', password: '123456' })

      const restored = await createAuthService({ authClient, userDataPath })
      await expect(restored.getState()).resolves.toMatchObject({
        session: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          userId: 'user-1',
          email: 'a@b.com',
          expiresAt: 123,
        },
        pendingPasswordReset: false,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('clears session after signOut', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'mightyrept-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'access-token',
              refresh_token: 'refresh-token',
              user: {
                id: 'user-1',
                email: 'a@b.com',
              },
              expires_at: 123,
            },
          },
          error: null,
        }),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    }

    try {
      const service = await createAuthService({ authClient, userDataPath })

      await service.signIn({ email: 'a@b.com', password: '123456' })
      await service.signOut()

      const restored = await createAuthService({ authClient, userDataPath })
      await expect(restored.getState()).resolves.toMatchObject({
        session: null,
        pendingPasswordReset: false,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('rejects signIn errors and does not persist session', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'mightyrept-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'invalid credentials' },
        }),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        signOut: vi.fn(),
      },
    }

    try {
      const service = await createAuthService({ authClient, userDataPath })

      await expect(service.signIn({ email: 'a@b.com', password: '123456' })).rejects.toThrow('invalid credentials')
      await expect(service.getState()).resolves.toMatchObject({
        session: null,
        pendingPasswordReset: false,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('rejects signOut errors', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'mightyrept-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'access-token',
              refresh_token: 'refresh-token',
              user: {
                id: 'user-1',
                email: 'a@b.com',
              },
              expires_at: 123,
            },
          },
          error: null,
        }),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: { message: 'sign out failed' } }),
      },
    }

    try {
      const service = await createAuthService({ authClient, userDataPath })

      await service.signIn({ email: 'a@b.com', password: '123456' })
      await expect(service.signOut()).rejects.toThrow('sign out failed')
      await expect(service.getState()).resolves.toMatchObject({
        session: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          userId: 'user-1',
          email: 'a@b.com',
          expiresAt: 123,
        },
        pendingPasswordReset: false,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('rejects signUp errors', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'mightyrept-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'signup failed' },
        }),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        signOut: vi.fn(),
      },
    }

    try {
      const service = await createAuthService({ authClient, userDataPath })

      await expect(service.signUp({ email: 'a@b.com', password: '123456' })).rejects.toThrow('signup failed')
      await expect(service.getState()).resolves.toMatchObject({
        session: null,
        pendingPasswordReset: false,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('rejects password reset errors without changing persisted state', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'mightyrept-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn().mockResolvedValue({
          data: {},
          error: { message: 'reset failed' },
        }),
        updateUser: vi.fn(),
        signOut: vi.fn(),
      },
    }

    try {
      const service = await createAuthService({ authClient, userDataPath })

      await expect(service.requestPasswordReset({ email: 'a@b.com' })).rejects.toThrow('reset failed')
      await expect(service.getState()).resolves.toMatchObject({
        session: null,
        pendingPasswordReset: false,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('rejects updatePassword errors without clearing recovery state', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'mightyrept-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn().mockResolvedValue({
          data: {},
          error: { message: 'update failed' },
        }),
        signOut: vi.fn(),
      },
    }

    try {
      await writeFile(
        join(userDataPath, 'auth-session.json'),
        JSON.stringify({
          session: null,
          pendingPasswordReset: true,
        }),
        'utf-8'
      )

      const service = await createAuthService({ authClient, userDataPath })

      await expect(service.updatePassword({ password: '654321' })).rejects.toThrow('update failed')
      await expect(service.getState()).resolves.toMatchObject({
        session: null,
        pendingPasswordReset: true,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('returns default state when persisted session JSON is corrupted', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'mightyrept-auth-'))

    try {
      await writeFile(join(userDataPath, 'auth-session.json'), '{ invalid json', 'utf-8')

      const service = await createAuthService({
        authClient: {
          auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updateUser: vi.fn(),
            signOut: vi.fn(),
          },
        },
        userDataPath,
      })

      await expect(service.getState()).resolves.toMatchObject({
        session: null,
        pendingPasswordReset: false,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('marks recovery state when callback url uses query string type', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'mightyrept-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        signOut: vi.fn(),
      },
    }

    try {
      const service = await createAuthService({ authClient, userDataPath })

      await expect(service.handleCallbackUrl('mightyrept://auth/callback?type=recovery')).resolves.toMatchObject({
        session: null,
        pendingPasswordReset: true,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })
})

describe('registerAuthHandlers', () => {
  it('registers auth ipc channels against the active service', async () => {
    const fakeAuthService = {
      getState: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
      handleCallbackUrl: vi.fn(),
    }

    const { setAuthService } = await import('../runtime')
    setAuthService(fakeAuthService)

    try {
      const { registerAuthHandlers } = await import('../../ipc/auth')
      registerAuthHandlers()

      expect(ipcHandleMock).toHaveBeenCalledWith('auth:getSession', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:signIn', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:signUp', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:requestPasswordReset', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:updatePassword', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:signOut', expect.any(Function))
    } finally {
      setAuthService(null)
      ipcHandleMock.mockReset()
    }
  })
})
