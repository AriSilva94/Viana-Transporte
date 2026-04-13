import type { AuthCredentials, AuthEmailRequest, AuthPasswordUpdate } from '../auth/service'
import { getAuthService } from '../auth/runtime'
import { handleRead } from './guarded'
import type { AuthPasswordResetResult, AuthSignUpResult, AuthState } from '../../shared/types'

export function registerAuthHandlers(): void {
  const authService = getAuthService()

  handleRead('auth:getSession', async (): Promise<AuthState> => {
    return authService.getState()
  })

  handleRead('auth:signIn', async (_, payload: AuthCredentials): Promise<AuthState> => {
    return authService.signIn(payload)
  })

  handleRead('auth:signUp', async (_, payload: AuthCredentials): Promise<AuthSignUpResult> => {
    return authService.signUp(payload)
  })

  handleRead('auth:requestPasswordReset', async (_, payload: AuthEmailRequest): Promise<AuthPasswordResetResult> => {
    return authService.requestPasswordReset(payload)
  })

  handleRead('auth:updatePassword', async (_, payload: AuthPasswordUpdate): Promise<AuthState> => {
    return authService.updatePassword(payload)
  })

  handleRead('auth:signOut', async () => {
    await authService.signOut()
  })
}
