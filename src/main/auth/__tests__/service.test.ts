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

const { assertWriteAllowedMock } = vi.hoisted(() => ({
  assertWriteAllowedMock: vi.fn(() => {
    throw new Error('write guard should not be used for auth channels')
  }),
}))

const { appMock } = vi.hoisted(() => ({
  appMock: {
    on: vi.fn(),
    quit: vi.fn(),
    requestSingleInstanceLock: vi.fn(),
    setAsDefaultProtocolClient: vi.fn(),
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

vi.mock('electron', () => ({
  app: appMock,
  ipcMain: {
    handle: ipcHandleMock,
  },
}))

vi.mock('../../services/license', () => ({
  assertWriteAllowed: assertWriteAllowedMock,
}))

import { createSupabaseAuthClientFromEnv } from '../client'
import { createProfileServiceFromSupabaseClient } from '../profile-service'
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

describe('createProfileServiceFromSupabaseClient', () => {
  it('loads the authenticated user profile from the profiles table', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'user-1',
          email: 'a@b.com',
          role: 'admin',
        },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    const service = createProfileServiceFromSupabaseClient({
      from,
    })

    await expect(service.getRequiredProfile('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'a@b.com',
      role: 'admin',
    })
    expect(from).toHaveBeenCalledWith('profiles')
    expect(select).toHaveBeenCalledWith('id,email,role')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
  })
})

describe('createAuthService', () => {
  it('persists session and profile after signIn and restores them in getState', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
    const profileService = {
      getRequiredProfile: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        role: 'admin',
      }),
    }
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
        setSession: vi.fn(),
        signOut: vi.fn(),
      },
    }

    try {
      const service = await createAuthService({ authClient, profileService, userDataPath })

      await expect(service.signIn({ email: 'a@b.com', password: '123456' })).resolves.toMatchObject({
        session: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
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
      })
      expect(profileService.getRequiredProfile).toHaveBeenCalledWith('user-1')

      const restored = await createAuthService({ authClient, profileService, userDataPath })
      await expect(restored.getState()).resolves.toMatchObject({
        session: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
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
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('normalizes legacy persisted auth state without a profile key', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))

    try {
      await writeFile(
        join(userDataPath, 'auth-session.json'),
        JSON.stringify({
          session: null,
          pendingPasswordReset: false,
        }),
        'utf-8'
      )

      const service = await createAuthService({
        authClient: {
          auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updateUser: vi.fn(),
            setSession: vi.fn(),
            signOut: vi.fn(),
          },
        },
        userDataPath,
      })

      await expect(service.getState()).resolves.toMatchObject({
        session: null,
        profile: null,
        pendingPasswordReset: false,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('clears session after signOut', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
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
        setSession: vi.fn(),
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
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'invalid credentials' },
        }),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        setSession: vi.fn(),
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

  it('rejects signIn when the authenticated user has no profile and does not persist session', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
    const profileService = {
      getRequiredProfile: vi.fn().mockRejectedValue(new Error('Missing profile for authenticated user user-1')),
    }
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
        setSession: vi.fn(),
        signOut: vi.fn(),
      },
    }

    try {
      const service = await createAuthService({ authClient, profileService, userDataPath })

      await expect(service.signIn({ email: 'a@b.com', password: '123456' })).rejects.toThrow(
        'Missing profile for authenticated user user-1'
      )
      await expect(service.getState()).resolves.toMatchObject({
        session: null,
        profile: null,
        pendingPasswordReset: false,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })

  it('rejects signOut errors', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
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
        setSession: vi.fn(),
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
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'signup failed' },
        }),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        setSession: vi.fn(),
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
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn().mockResolvedValue({
          data: {},
          error: { message: 'reset failed' },
        }),
        updateUser: vi.fn(),
        setSession: vi.fn(),
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
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn().mockResolvedValue({
          data: {},
          error: { message: 'update failed' },
        }),
        setSession: vi.fn(),
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
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))

    try {
      await writeFile(join(userDataPath, 'auth-session.json'), '{ invalid json', 'utf-8')

      const service = await createAuthService({
        authClient: {
          auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updateUser: vi.fn(),
            setSession: vi.fn(),
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
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
    const authClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        setSession: vi.fn(),
        signOut: vi.fn(),
      },
    }

    try {
      const service = await createAuthService({ authClient, userDataPath })

      await expect(service.handleCallbackUrl('viana-transporte://auth/callback?type=recovery')).resolves.toMatchObject({
        session: null,
        pendingPasswordReset: true,
      })
    } finally {
      await rm(userDataPath, { recursive: true, force: true })
    }
  })
  it('establishes recovery session from callback tokens before marking recovery state', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'viana-transporte-auth-'))
    const profileService = {
      getRequiredProfile: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        role: 'admin',
      }),
    }
    const setSessionMock = vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          user: {
            id: 'user-1',
            email: 'a@b.com',
          },
          expires_at: 456,
        },
      },
      error: null,
    })
    const authClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        setSession: setSessionMock,
        updateUser: vi.fn(),
        signOut: vi.fn(),
      },
    }

    try {
      const service = await createAuthService({ authClient, profileService, userDataPath })

      await expect(
        service.handleCallbackUrl(
          'viana-transporte://auth/callback#type=recovery&access_token=access-token&refresh_token=refresh-token'
        )
      ).resolves.toMatchObject({
        session: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          userId: 'user-1',
          email: 'a@b.com',
          expiresAt: 456,
        },
        profile: {
          id: 'user-1',
          email: 'a@b.com',
          role: 'admin',
        },
        pendingPasswordReset: true,
      })

      expect(setSessionMock).toHaveBeenCalledWith({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      })
      expect(profileService.getRequiredProfile).toHaveBeenCalledWith('user-1')
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
      const handlers = new Map<string, (...args: unknown[]) => unknown>()
      ipcHandleMock.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler)
      })

      const { registerAuthHandlers } = await import('../../ipc/auth')
      registerAuthHandlers()

      expect(ipcHandleMock).toHaveBeenCalledWith('auth:getSession', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:signIn', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:signUp', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:requestPasswordReset', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:updatePassword', expect.any(Function))
      expect(ipcHandleMock).toHaveBeenCalledWith('auth:signOut', expect.any(Function))

      const signInHandler = handlers.get('auth:signIn')
      expect(signInHandler).toBeTypeOf('function')

      await expect(signInHandler?.({}, { email: 'a@b.com', password: '123456' })).resolves.toEqual(undefined)

      expect(fakeAuthService.signIn).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: '123456',
      })
      expect(assertWriteAllowedMock).not.toHaveBeenCalled()
    } finally {
      setAuthService(null)
      ipcHandleMock.mockReset()
      assertWriteAllowedMock.mockReset()
    }
  })
})

describe('createAuthDeepLinkRuntime', () => {
  it('registers protocol handlers and forwards recovery deep links to the auth service', async () => {
    const callbacks = new Map<string, (...args: unknown[]) => unknown>()
    appMock.on.mockImplementation((event: string, handler: (...args: unknown[]) => unknown) => {
      callbacks.set(event, handler)
      return appMock
    })
    appMock.requestSingleInstanceLock.mockReturnValue(true)

    const authService = {
      getState: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
      handleCallbackUrl: vi.fn().mockResolvedValue({
        session: null,
        pendingPasswordReset: true,
      }),
    }

    const { createAuthDeepLinkRuntime } = await import('../deep-link')
    const runtime = createAuthDeepLinkRuntime()

    expect(appMock.setAsDefaultProtocolClient).toHaveBeenCalledWith(
      'viana-transporte',
      expect.any(String),
      expect.any(Array)
    )
    expect(appMock.requestSingleInstanceLock).toHaveBeenCalled()

    const secondInstance = callbacks.get('second-instance')
    const openUrl = callbacks.get('open-url')

    expect(secondInstance).toBeTypeOf('function')
    expect(openUrl).toBeTypeOf('function')

    await secondInstance?.({}, ['viana-transporte://auth/callback#type=recovery'])
    await openUrl?.({ preventDefault: vi.fn() }, 'viana-transporte://auth/callback?type=recovery')
    runtime.attachAuthService(authService)

    expect(authService.handleCallbackUrl).toHaveBeenCalledWith('viana-transporte://auth/callback#type=recovery')
    expect(authService.handleCallbackUrl).toHaveBeenCalledWith('viana-transporte://auth/callback?type=recovery')
  })

  it('queues cold start deep links until the auth service is attached', async () => {
    const originalArgv = process.argv
    process.argv = ['electron', 'viana-transporte://auth/callback#type=recovery']

    try {
      appMock.on.mockImplementation((event: string, handler: (...args: unknown[]) => unknown) => {
        return appMock
      })
      appMock.requestSingleInstanceLock.mockReturnValue(true)

      const authService = {
        getState: vi.fn(),
        signIn: vi.fn(),
        signUp: vi.fn(),
        requestPasswordReset: vi.fn(),
        updatePassword: vi.fn(),
        signOut: vi.fn(),
        handleCallbackUrl: vi.fn(),
      }

      const { createAuthDeepLinkRuntime } = await import('../deep-link')
      const runtime = createAuthDeepLinkRuntime()

      expect(runtime.shouldQuit).toBe(false)
      expect(authService.handleCallbackUrl).not.toHaveBeenCalled()

      runtime.attachAuthService(authService)

      expect(authService.handleCallbackUrl).toHaveBeenCalledWith('viana-transporte://auth/callback#type=recovery')
    } finally {
      process.argv = originalArgv
      appMock.on.mockReset()
      appMock.quit.mockReset()
      appMock.setAsDefaultProtocolClient.mockReset()
      appMock.requestSingleInstanceLock.mockReset()
    }
  })

  it('signals shouldQuit when the single instance lock cannot be acquired', async () => {
    appMock.on.mockImplementation(() => appMock)
    appMock.requestSingleInstanceLock.mockReturnValue(false)

    const { createAuthDeepLinkRuntime } = await import('../deep-link')
    const runtime = createAuthDeepLinkRuntime()

    expect(runtime.shouldQuit).toBe(true)
    expect(appMock.quit).not.toHaveBeenCalled()

    appMock.on.mockReset()
    appMock.quit.mockReset()
    appMock.setAsDefaultProtocolClient.mockReset()
    appMock.requestSingleInstanceLock.mockReset()
  })
})

describe('startAppLifecycle', () => {
  it('skips whenReady when shouldQuit is true', async () => {
    const whenReady = vi.fn()
    const quit = vi.fn()
    const bootstrap = vi.fn()

    const { startAppLifecycle } = await import('../../app-lifecycle')
    startAppLifecycle({
      shouldQuit: true,
      whenReady,
      quit,
      bootstrap,
    })

    expect(quit).toHaveBeenCalledOnce()
    expect(whenReady).not.toHaveBeenCalled()
    expect(bootstrap).not.toHaveBeenCalled()
  })

  it('calls whenReady when shouldQuit is false', async () => {
    const whenReady = vi.fn().mockResolvedValue(undefined)
    const quit = vi.fn()
    const bootstrap = vi.fn()

    const { startAppLifecycle } = await import('../../app-lifecycle')
    startAppLifecycle({
      shouldQuit: false,
      whenReady,
      quit,
      bootstrap,
    })

    expect(quit).not.toHaveBeenCalled()
    expect(whenReady).toHaveBeenCalledOnce()
    await vi.waitFor(() => {
      expect(bootstrap).toHaveBeenCalledOnce()
    })
  })
})
