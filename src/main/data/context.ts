import type { AuthState } from '../../shared/types'

export interface DataContextDependencies {
  getAuthState: () => Promise<AuthState>
}

export interface DataContext {
  getRequiredUserId: () => Promise<string>
}

export function createDataContext(deps: DataContextDependencies): DataContext {
  return {
    async getRequiredUserId(): Promise<string> {
      const state = await deps.getAuthState()
      const userId = state.session?.userId
      if (!userId) {
        throw new Error('No authenticated user for protected data access')
      }

      return userId
    },
  }
}
