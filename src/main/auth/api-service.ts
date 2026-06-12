import type {
  AuthPasswordResetResult,
  AuthProfile,
  AuthSession,
  AuthSignUpResult,
  AuthState,
} from '../../shared/types'
import { ApiHttpClient } from '../api/http'
import { createAuthSessionStore, type AuthSessionStore } from './session-store'
import type { AuthCredentials, AuthEmailRequest, AuthPasswordUpdate, AuthService } from './service'

interface ApiAuthResponse {
  accessToken: string
  refreshToken: string
  accessExpiresAt?: string | number
  user?: AuthProfile
}

interface ApiUserResponse extends AuthProfile {}

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
    onUnauthorized: refreshSession,
  })

  async function writeState(state: AuthState): Promise<AuthState> {
    await sessionStore.writeState(state)
    return state
  }

  async function clearLocalAccess(): Promise<AuthState> {
    await sessionStore.clearState()
    return createSignedOutState()
  }

  async function refreshSession(): Promise<AuthState | null> {
    const currentState = await sessionStore.readState()
    const refreshToken = currentState.session?.refreshToken

    if (!refreshToken) {
      return null
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
      return writeState(nextState)
    } catch {
      await clearLocalAccess()
      return null
    }
  }

  return {
    async getCurrentState() {
      return sessionStore.readState()
    },

    async getState() {
      const currentState = await sessionStore.readState()

      if (!currentState.session) {
        return currentState
      }

      try {
        const profile = await authClient.get<ApiUserResponse>('/auth/me')
        return writeState({ ...currentState, profile })
      } catch {
        return clearLocalAccess()
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
