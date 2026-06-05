import { getAuthService } from '../auth/runtime'
import { ApiHttpClient } from '../api/http'
import { handleRead, handleWrite } from './guarded'
import type { AuthRole, UserProfileListItem } from '../../shared/types'

interface UpdateUserRolePayload {
  userId: string
  role: AuthRole
}

let usersClient: ApiHttpClient | null = null

function getUsersClient() {
  if (!usersClient) {
    usersClient = new ApiHttpClient({
      getAuthState: () => getAuthService().getCurrentState(),
    })
  }

  return usersClient
}

export function registerUsersHandlers(): void {
  handleRead('users:list', async (): Promise<UserProfileListItem[]> => {
    return getUsersClient().get<UserProfileListItem[]>('/users')
  })

  handleWrite('users:updateRole', async (_, payload: UpdateUserRolePayload): Promise<void> => {
    await getUsersClient().patch(`/users/${payload.userId}/role`, { role: payload.role })
  })

  handleWrite('users:revokeAccess', async (_, userId: string): Promise<void> => {
    await getUsersClient().patch(`/users/${userId}/revoke`)
  })

  handleWrite('users:reactivateAccess', async (_, userId: string): Promise<void> => {
    await getUsersClient().patch(`/users/${userId}/reactivate`)
  })
}
