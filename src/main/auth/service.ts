import type {
  AuthPasswordResetResult,
  AuthSignUpResult,
  AuthState,
} from '../../shared/types'

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

export interface AuthService {
  getCurrentState: () => Promise<AuthState>
  getState: () => Promise<AuthState>
  signIn: (input: AuthCredentials) => Promise<AuthState>
  signUp: (input: AuthCredentials) => Promise<AuthSignUpResult>
  requestPasswordReset: (input: AuthEmailRequest) => Promise<AuthPasswordResetResult>
  updatePassword: (input: AuthPasswordUpdate) => Promise<AuthState>
  signOut: () => Promise<void>
  handleCallbackUrl: (url: string) => Promise<AuthState>
}
