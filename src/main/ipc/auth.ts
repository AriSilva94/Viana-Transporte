import type { AuthCredentials, AuthEmailRequest, AuthPasswordUpdate } from '../auth/service'
import { getAuthService } from '../auth/runtime'
import { handleRead, handleWrite } from './guarded'

export function registerAuthHandlers(): void {
  const authService = getAuthService()

  handleRead('auth:getSession', async () => {
    return authService.getState()
  })

  handleWrite('auth:signIn', async (_, payload: AuthCredentials) => {
    return authService.signIn(payload)
  })

  handleWrite('auth:signUp', async (_, payload: AuthCredentials) => {
    return authService.signUp(payload)
  })

  handleWrite('auth:requestPasswordReset', async (_, payload: AuthEmailRequest) => {
    return authService.requestPasswordReset(payload)
  })

  handleWrite('auth:updatePassword', async (_, payload: AuthPasswordUpdate) => {
    return authService.updatePassword(payload)
  })

  handleWrite('auth:signOut', async () => {
    await authService.signOut()
  })
}
