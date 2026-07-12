import type {
  AuthPasswordResetResult,
  AuthProfile,
  AuthSession,
  AuthSignUpResult,
  AuthState,
} from '../../shared/types'
import { ApiHttpClient, ApiHttpError } from '../api/http'
import { createAuthSessionStore, type AuthSessionStore } from './session-store'
import type { AuthCredentials, AuthEmailRequest, AuthPasswordUpdate, AuthService } from './service'

interface ApiAuthResponse {
  accessToken: string
  refreshToken: string
  accessExpiresAt?: string | number
  user?: AuthProfile
}

interface ApiUserResponse extends AuthProfile {}

type RefreshOutcome =
  | { status: 'refreshed'; state: AuthState }
  | { status: 'unauthorized' }
  | { status: 'unavailable' }

export interface ApiAuthServiceDependencies {
  userDataPath: string
  sessionStore?: AuthSessionStore
}

function createSignedOutState(): AuthState {
  return {
    session: null,
    profile: null,
    pendingPasswordReset: false,
    pendingPasswordResetToken: null,
  }
}

function createStateFromApiResponse(response: ApiAuthResponse): AuthState {
  const user = response.user ?? null

  return {
    session: user
      ? {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          userId: user.id,
          email: user.email,
          expiresAt: response.accessExpiresAt ? new Date(response.accessExpiresAt).getTime() : null,
        }
      : null,
    profile: user,
    pendingPasswordReset: false,
    pendingPasswordResetToken: null,
  }
}

export function createApiAuthService({
  userDataPath,
  sessionStore = createAuthSessionStore(userDataPath),
}: ApiAuthServiceDependencies): AuthService {
  const anonymousClient = new ApiHttpClient()
  const authClient = new ApiHttpClient({
    getAuthState: () => sessionStore.readState(),
    onUnauthorized: handleUnauthorized,
  })

  // Dedupes concurrent refreshes. The API rotates and revokes the refresh token
  // on every /auth/refresh, so two parallel refreshes with the same token would
  // make the second fail and revoke the whole token family — logging the user
  // out. Single-flight guarantees only one rotation runs at a time.
  let refreshInFlight: Promise<RefreshOutcome> | null = null

  async function writeState(state: AuthState): Promise<AuthState> {
    await sessionStore.writeState(state)
    return state
  }

  async function clearLocalAccess(): Promise<AuthState> {
    await sessionStore.clearState()
    return createSignedOutState()
  }

  async function doRefreshSession(): Promise<RefreshOutcome> {
    const currentState = await sessionStore.readState()
    const refreshToken = currentState.session?.refreshToken

    if (!refreshToken) {
      return { status: 'unauthorized' }
    }

    try {
      const response = await anonymousClient.post<ApiAuthResponse>('/auth/refresh', {
        refreshToken,
      })
      const nextState: AuthState = {
        ...currentState,
        session: currentState.session
          ? {
              ...currentState.session,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              expiresAt: response.accessExpiresAt ? new Date(response.accessExpiresAt).getTime() : null,
            }
          : null,
      }
      return { status: 'refreshed', state: await writeState(nextState) }
    } catch (error) {
      // Only a 401 means the refresh token is genuinely invalid/expired/revoked
      // and the user must re-authenticate. Network/transport or 5xx failures are
      // transient — keep the stored session so the user stays logged in offline.
      if (error instanceof ApiHttpError && error.status === 401) {
        return { status: 'unauthorized' }
      }

      return { status: 'unavailable' }
    }
  }

  function refreshSession(): Promise<RefreshOutcome> {
    if (!refreshInFlight) {
      refreshInFlight = doRefreshSession().finally(() => {
        refreshInFlight = null
      })
    }

    return refreshInFlight
  }

  // Adapts the rich refresh outcome to the HTTP client's retry contract: a 401
  // clears local credentials; transient failures keep the session for a retry.
  async function handleUnauthorized(): Promise<AuthState | null> {
    const outcome = await refreshSession()

    if (outcome.status === 'refreshed') {
      return outcome.state
    }

    if (outcome.status === 'unauthorized') {
      await clearLocalAccess()
    }

    return null
  }

  // Persists a freshly fetched profile WITHOUT clobbering tokens. A refresh may
  // have rotated the tokens during the /auth/me round-trip, so we re-read the
  // latest persisted state instead of reusing a stale pre-request snapshot.
  async function persistProfile(profile: AuthProfile): Promise<AuthState> {
    const latestState = await sessionStore.readState()
    if (!latestState.session) {
      return latestState
    }

    return writeState({ ...latestState, profile })
  }

  return {
    async getCurrentState() {
      return sessionStore.readState()
    },

    async getState(options?: { slide?: boolean }) {
      const currentState = await sessionStore.readState()

      if (!currentState.session) {
        return currentState
      }

      // Option A: proactively rotate on app open so the 30-day refresh window
      // slides forward every launch, even when the access token is still valid.
      if (options?.slide) {
        const outcome = await refreshSession()
        if (outcome.status === 'unauthorized') {
          await clearLocalAccess()
          return createSignedOutState()
        }
        if (outcome.status === 'unavailable') {
          // Offline/server down at launch: keep the user logged in locally.
          return currentState
        }
      }

      try {
        const profile = await authClient.get<ApiUserResponse>('/auth/me')
        return persistProfile(profile)
      } catch (error) {
        // A 401 means the session is truly invalid → sign out. Transient errors
        // (offline/server) must not destroy a valid session.
        if (error instanceof ApiHttpError && error.status === 401) {
          return clearLocalAccess()
        }

        return sessionStore.readState()
      }
    },

    async signIn(input: AuthCredentials) {
      return writeState(
        createStateFromApiResponse(await anonymousClient.post<ApiAuthResponse>('/auth/login', input))
      )
    },

    async signUp(input: AuthCredentials): Promise<AuthSignUpResult> {
      await anonymousClient.post('/auth/register', input)
      return { emailConfirmationSent: true }
    },

    async requestPasswordReset(input: AuthEmailRequest): Promise<AuthPasswordResetResult> {
      await anonymousClient.post('/auth/password/forgot', input)
      return { emailSent: true }
    },

    async updatePassword(input: AuthPasswordUpdate) {
      const currentState = await sessionStore.readState()

      if (currentState.pendingPasswordReset && currentState.pendingPasswordResetToken) {
        await anonymousClient.post('/auth/password/reset', {
          token: currentState.pendingPasswordResetToken,
          password: input.password,
        })
        return writeState(createSignedOutState())
      }

      await authClient.post('/auth/password/change', {
        currentPassword: input.currentPassword,
        newPassword: input.password,
      })
      return writeState({ ...currentState, pendingPasswordReset: false, pendingPasswordResetToken: null })
    },

    async signOut() {
      const currentState = await sessionStore.readState()
      if (currentState.session?.refreshToken) {
        try {
          await authClient.post('/auth/logout', {
            refreshToken: currentState.session.refreshToken,
          })
        } catch {
          // Local logout must still clear the desktop session.
        }
      }
      await clearLocalAccess()
    },

    async handleCallbackUrl(url: string) {
      const parsed = new URL(url)
      const token = parsed.searchParams.get('token')

      if (!token) {
        return sessionStore.readState()
      }

      const currentState = await sessionStore.readState()
      return writeState({
        ...currentState,
        pendingPasswordReset: true,
        pendingPasswordResetToken: token,
      })
    },
  }
}
