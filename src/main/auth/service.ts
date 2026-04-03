import type {
  AuthPasswordResetResult,
  AuthSession,
  AuthSignUpResult,
  AuthState,
} from '../../shared/types'
import { createSupabaseAuthClientFromEnv } from './client'
import { createAuthSessionStore, type AuthSessionStore } from './session-store'

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthEmailRequest {
  email: string
}

export interface AuthPasswordUpdate {
  password: string
}

export interface SupabaseSessionLike {
  access_token: string
  refresh_token: string
  expires_at: number | null
  user: {
    id: string
    email: string | null
  } | null
}

export interface SupabaseAuthClientLike {
  auth: {
    getSession?: () => Promise<unknown>
    signInWithPassword: (credentials: AuthCredentials) => Promise<{ data: { session: SupabaseSessionLike | null }; error: unknown | null }>
    signUp: (credentials: AuthCredentials) => Promise<{ data: { session: SupabaseSessionLike | null }; error: unknown | null }>
    resetPasswordForEmail: (
      email: string,
      options?: { redirectTo?: string }
    ) => Promise<{ data: unknown; error: unknown | null }>
    updateUser: (attributes: AuthPasswordUpdate) => Promise<{ data: unknown; error: unknown | null }>
    signOut: () => Promise<{ error: unknown | null }>
  }
}

export interface AuthService {
  getState: () => Promise<AuthState>
  signIn: (input: AuthCredentials) => Promise<AuthState>
  signUp: (input: AuthCredentials) => Promise<AuthSignUpResult>
  requestPasswordReset: (input: AuthEmailRequest) => Promise<AuthPasswordResetResult>
  updatePassword: (input: AuthPasswordUpdate) => Promise<AuthState>
  signOut: () => Promise<void>
  handleCallbackUrl: (url: string) => Promise<AuthState>
}

export interface AuthServiceDependencies {
  userDataPath: string
  authClient?: SupabaseAuthClientLike
  sessionStore?: AuthSessionStore
}

function mapSupabaseSession(session: SupabaseSessionLike | null): AuthSession | null {
  if (!session) {
    return null
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    userId: session.user?.id ?? '',
    email: session.user?.email ?? null,
    expiresAt: session.expires_at,
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallbackMessage
}

function throwIfSupabaseError(error: unknown, fallbackMessage: string): void {
  if (!error) {
    return
  }

  throw new Error(getErrorMessage(error, fallbackMessage))
}

function parseAuthCallbackType(url: string): string | null {
  try {
    const callbackUrl = new URL(url)
    const queryType = callbackUrl.searchParams.get('type')
    if (queryType) {
      return queryType
    }

    const hash = callbackUrl.hash.startsWith('#') ? callbackUrl.hash.slice(1) : callbackUrl.hash
    const params = new URLSearchParams(hash)
    return params.get('type')
  } catch {
    return null
  }
}

function createAuthStateFromCurrentState(state: AuthState): AuthState {
  return {
    session: state.session,
    pendingPasswordReset: false,
  }
}

export function createAuthService({
  userDataPath,
  authClient,
  sessionStore = createAuthSessionStore(userDataPath),
}: AuthServiceDependencies): AuthService {
  let authClientPromise = authClient ? Promise.resolve(authClient) : null

  async function resolveAuthClient(): Promise<SupabaseAuthClientLike> {
    if (!authClientPromise) {
      authClientPromise = createSupabaseAuthClientFromEnv() as unknown as Promise<SupabaseAuthClientLike>
    }

    return authClientPromise
  }

  async function readState(): Promise<AuthState> {
    return sessionStore.readState()
  }

  async function writeState(state: AuthState): Promise<AuthState> {
    await sessionStore.writeState(state)
    return state
  }

  return {
    async getState() {
      return readState()
    },
    async signIn({ email, password }) {
      const client = await resolveAuthClient()
      const result = await client.auth.signInWithPassword({ email, password })
      throwIfSupabaseError(result.error, 'Failed to sign in')
      const nextState = {
        session: mapSupabaseSession(result.data.session),
        pendingPasswordReset: false,
      }

      return writeState(nextState)
    },
    async signUp({ email, password }) {
      const client = await resolveAuthClient()
      const result = await client.auth.signUp({ email, password })
      throwIfSupabaseError(result.error, 'Failed to sign up')
      return {
        emailConfirmationSent: true,
      }
    },
    async requestPasswordReset({ email }) {
      const client = await resolveAuthClient()
      const redirectTo = process.env.SUPABASE_AUTH_REDIRECT_URL?.trim()
      const result = await client.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined)
      throwIfSupabaseError(result.error, 'Failed to request password reset')

      const currentState = await readState()
      await writeState({
        ...currentState,
        pendingPasswordReset: true,
      })

      return {
        emailSent: true,
      }
    },
    async updatePassword({ password }) {
      const client = await resolveAuthClient()
      const result = await client.auth.updateUser({ password })
      throwIfSupabaseError(result.error, 'Failed to update password')

      const currentState = await readState()
      return writeState(createAuthStateFromCurrentState(currentState))
    },
    async signOut() {
      const client = await resolveAuthClient()
      const result = await client.auth.signOut()
      throwIfSupabaseError(result.error, 'Failed to sign out')
      await sessionStore.clearState()
    },
    async handleCallbackUrl(url) {
      const callbackType = parseAuthCallbackType(url)
      if (callbackType === 'recovery') {
        const currentState = await readState()
        return writeState({
          ...currentState,
          pendingPasswordReset: true,
        })
      }

      return readState()
    },
  }
}
