import type {
  AuthPasswordResetResult,
  AuthSignUpResult,
  AuthState,
} from '../../shared/types'
import type { AuthService } from './service'

const E2E_USER_ID = 'e2e-user'
const E2E_USER_EMAIL = 'e2e@viana-transporte.local'

function memorySessionState(): AuthState {
  return {
    session: {
      accessToken: 'e2e-access-token',
      refreshToken: 'e2e-refresh-token',
      userId: E2E_USER_ID,
      email: E2E_USER_EMAIL,
      expiresAt: null,
    },
    profile: {
      id: E2E_USER_ID,
      email: E2E_USER_EMAIL,
      role: 'admin',
      status: 'active',
    },
    pendingPasswordReset: false,
  }
}

export function createMemoryAuthService(): AuthService {
  const state = memorySessionState()

  return {
    async getState() {
      return state
    },
    async signIn() {
      return state
    },
    async signUp(): Promise<AuthSignUpResult> {
      return { emailConfirmationSent: true }
    },
    async requestPasswordReset(): Promise<AuthPasswordResetResult> {
      return { emailSent: true }
    },
    async updatePassword() {
      return state
    },
    async signOut() {
      // no-op in memory mode
    },
    async handleCallbackUrl() {
      return state
    },
  }
}
