import type { AuthService } from './service'

let authService: AuthService | null = null

export function setAuthService(nextAuthService: AuthService | null): void {
  authService = nextAuthService
}

export function getAuthService(): AuthService {
  if (!authService) {
    throw new Error('Auth service has not been initialized')
  }

  return authService
}
