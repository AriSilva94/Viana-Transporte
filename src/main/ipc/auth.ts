import type { AuthCredentials, AuthEmailRequest, AuthPasswordUpdate } from '../auth/service'
import { getAuthService } from '../auth/runtime'
import { handleRead } from './guarded'

export function registerAuthHandlers(): void {
  const authService = getAuthService()

  handleRead('auth:getSession', async () => {
    return authService.getState()
  })

  handleRead('auth:signIn', async (_, payload: AuthCredentials) => {
    return authService.signIn(payload)
  })

  handleRead('auth:signUp', async (_, payload: AuthCredentials) => {
    return authService.signUp(payload)
  })

  handleRead('auth:requestPasswordReset', async (_, payload: AuthEmailRequest) => {
    return authService.requestPasswordReset(payload)
  })

  handleRead('auth:updatePassword', async (_, payload: AuthPasswordUpdate) => {
    return authService.updatePassword(payload)
  })

  handleRead('auth:signOut', async () => {
    await authService.signOut()
  })
}
