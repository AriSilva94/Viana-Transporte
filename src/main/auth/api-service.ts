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
          expiresAt: null,
        }
      : null,
    profile: user,
    pendingPasswordReset: false,
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
      const currentState = await sessionStore.readState()
      await writeState({ ...currentState, pendingPasswordReset: true })
      return { emailSent: true }
    },

    async updatePassword(input: AuthPasswordUpdate) {
      const currentState = await sessionStore.readState()

      if (currentState.pendingPasswordReset) {
        throw new Error('Password reset deep links are not available in the NestJS API yet')
      }

      await authClient.post('/auth/password/change', {
        currentPassword: input.password,
        newPassword: input.password,
      })
      return writeState({ ...currentState, pendingPasswordReset: false })
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

    async handleCallbackUrl() {
      return sessionStore.readState()
    },
  }
}
