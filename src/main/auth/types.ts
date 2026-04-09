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

export type { AuthState, AuthSignUpResult, AuthPasswordResetResult }
