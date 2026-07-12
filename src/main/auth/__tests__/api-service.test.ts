import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthState } from '../../../shared/types'
import { createApiAuthService } from '../api-service'
import type { AuthSessionStore } from '../session-store'

const PROFILE = { id: 'u1', email: 'u@x.com', role: 'admin', status: 'active' } as const

function signedOut(): AuthState {
  return { session: null, profile: null, pendingPasswordReset: false, pendingPasswordResetToken: null }
}

function loggedIn(): AuthState {
  return {
    session: { accessToken: 'A0', refreshToken: 'R0', userId: 'u1', email: 'u@x.com', expiresAt: 123 },
    profile: { ...PROFILE },
    pendingPasswordReset: false,
    pendingPasswordResetToken: null,
  }
}

function createMemoryStore(initial: AuthState) {
  let state: AuthState | null = initial
  const store: AuthSessionStore = {
    readState: async () => state ?? signedOut(),
    writeState: async (next) => {
      state = next
    },
    clearState: async () => {
      state = null
    },
  }
  return { store, snapshot: () => state }
}

function jsonRes(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
}

/** Router: /auth/refresh rotates R0->R1/A0->A1 once; /auth/me only accepts A1. */
function createFetchRouter(
  opts: { refreshStatus?: number; refreshThrows?: boolean; meThrows?: boolean } = {},
) {
  return vi.fn(async (input: unknown, init?: { method?: string; headers?: Record<string, string>; body?: string }) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    const auth = init?.headers?.Authorization

    if (url.endsWith('/auth/refresh') && method === 'POST') {
      if (opts.refreshThrows) {
        throw new TypeError('fetch failed')
      }
      if (opts.refreshStatus && opts.refreshStatus !== 200) {
        return jsonRes(opts.refreshStatus, { message: 'invalid_refresh_token' })
      }
      const body = JSON.parse(init?.body ?? '{}') as { refreshToken?: string }
      if (body.refreshToken === 'R0') {
        return jsonRes(200, {
          accessToken: 'A1',
          refreshToken: 'R1',
          accessExpiresAt: new Date(Date.now() + 900_000).toISOString(),
        })
      }
      return jsonRes(401, { message: 'invalid_refresh_token' })
    }

    if (url.endsWith('/auth/me')) {
      if (opts.meThrows) {
        throw new TypeError('fetch failed')
      }
      return auth === 'Bearer A1' ? jsonRes(200, PROFILE) : jsonRes(401, { message: 'unauthorized' })
    }

    return jsonRes(404, { message: 'not found' })
  })
}

function countCalls(mock: ReturnType<typeof createFetchRouter>, suffix: string): number {
  return mock.mock.calls.filter(([input]) => String(input).endsWith(suffix)).length
}

describe('createApiAuthService.getState', () => {
  beforeEach(() => {
    process.env.VIANA_API_BASE_URL = 'http://test.local'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.VIANA_API_BASE_URL
  })

  it('persists the rotated tokens after a reactive 401 refresh (no clobber)', async () => {
    const fetchMock = createFetchRouter()
    vi.stubGlobal('fetch', fetchMock)
    const { store, snapshot } = createMemoryStore(loggedIn())
    const service = createApiAuthService({ userDataPath: '/tmp/x', sessionStore: store })

    const result = await service.getState()

    // Stale pre-refresh snapshot must NOT overwrite the freshly rotated pair.
    expect(result.session?.accessToken).toBe('A1')
    expect(result.session?.refreshToken).toBe('R1')
    expect(snapshot()?.session?.refreshToken).toBe('R1')
  })

  it('slides the window on open by rotating before validating (Option A)', async () => {
    const fetchMock = createFetchRouter()
    vi.stubGlobal('fetch', fetchMock)
    const { store, snapshot } = createMemoryStore(loggedIn())
    const service = createApiAuthService({ userDataPath: '/tmp/x', sessionStore: store })

    const result = await service.getState({ slide: true })

    expect(countCalls(fetchMock, '/auth/refresh')).toBe(1)
    expect(result.session?.refreshToken).toBe('R1')
    expect(snapshot()?.session?.accessToken).toBe('A1')
  })

  it('dedupes concurrent refreshes via single-flight', async () => {
    const fetchMock = createFetchRouter()
    vi.stubGlobal('fetch', fetchMock)
    const { store } = createMemoryStore(loggedIn())
    const service = createApiAuthService({ userDataPath: '/tmp/x', sessionStore: store })

    const [a, b] = await Promise.all([service.getState({ slide: true }), service.getState({ slide: true })])

    expect(countCalls(fetchMock, '/auth/refresh')).toBe(1)
    expect(a.session?.refreshToken).toBe('R1')
    expect(b.session?.refreshToken).toBe('R1')
  })

  it('signs out when the refresh token is expired/revoked', async () => {
    const fetchMock = createFetchRouter({ refreshStatus: 401 })
    vi.stubGlobal('fetch', fetchMock)
    const { store, snapshot } = createMemoryStore(loggedIn())
    const service = createApiAuthService({ userDataPath: '/tmp/x', sessionStore: store })

    const result = await service.getState({ slide: true })

    expect(result.session).toBeNull()
    expect(snapshot()).toBeNull()
  })

  it('stays logged in when offline at launch (network error on slide refresh)', async () => {
    const fetchMock = createFetchRouter({ refreshThrows: true })
    vi.stubGlobal('fetch', fetchMock)
    const { store, snapshot } = createMemoryStore(loggedIn())
    const service = createApiAuthService({ userDataPath: '/tmp/x', sessionStore: store })

    const result = await service.getState({ slide: true })

    // Session preserved, tokens untouched, and no validation call attempted.
    expect(result.session?.refreshToken).toBe('R0')
    expect(snapshot()?.session?.refreshToken).toBe('R0')
    expect(countCalls(fetchMock, '/auth/me')).toBe(0)
  })

  it('keeps the session on a transient 5xx during slide refresh', async () => {
    const fetchMock = createFetchRouter({ refreshStatus: 503 })
    vi.stubGlobal('fetch', fetchMock)
    const { store } = createMemoryStore(loggedIn())
    const service = createApiAuthService({ userDataPath: '/tmp/x', sessionStore: store })

    const result = await service.getState({ slide: true })

    expect(result.session?.accessToken).toBe('A0')
  })

  it('keeps the session when /auth/me fails with a network error (reactive)', async () => {
    const fetchMock = createFetchRouter({ meThrows: true })
    vi.stubGlobal('fetch', fetchMock)
    const { store, snapshot } = createMemoryStore(loggedIn())
    const service = createApiAuthService({ userDataPath: '/tmp/x', sessionStore: store })

    const result = await service.getState()

    expect(result.session?.refreshToken).toBe('R0')
    expect(snapshot()?.session).not.toBeNull()
  })
})
