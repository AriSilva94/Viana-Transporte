import { getAuthService } from '../auth/runtime'
import { createUserManagementServiceFromEnv } from '../auth/user-management-service'
import { handleRead, handleWrite } from './guarded'
import type { AuthRole, UserProfileListItem } from '../../shared/types'

interface UpdateUserRolePayload {
  userId: string
  role: AuthRole
}

let userManagementServicePromise:
  | Promise<Awaited<ReturnType<typeof createUserManagementServiceFromEnv>>>
  | null = null

async function getUserManagementService() {
  if (!userManagementServicePromise) {
    userManagementServicePromise = createUserManagementServiceFromEnv(getAuthService())
  }

  return userManagementServicePromise
}

export function registerUsersHandlers(): void {
  handleRead('users:list', async (): Promise<UserProfileListItem[]> => {
    const service = await getUserManagementService()
    return service.listProfiles()
  })

  handleWrite('users:updateRole', async (_, payload: UpdateUserRolePayload): Promise<void> => {
    const service = await getUserManagementService()
    await service.updateRole(payload.userId, payload.role)
  })
}
