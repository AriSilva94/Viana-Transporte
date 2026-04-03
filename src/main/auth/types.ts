import type { AuthState } from '../../shared/types'

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

export interface SignUpResult {
  emailConfirmationSent: true
}

export interface PasswordResetResult {
  emailSent: true
}

export type { AuthState }
