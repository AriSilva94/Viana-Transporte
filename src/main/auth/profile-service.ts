import type { AuthProfile } from '../../shared/types'
import type { SupabaseClientBootstrap } from '../data/supabase/client'

export interface ProfileRepository {
  getByUserId: (userId: string) => Promise<AuthProfile | null>
}

export interface ProfileServiceDependencies {
  profiles: ProfileRepository
}

export interface ProfileService {
  getRequiredProfile: (userId: string) => Promise<AuthProfile>
}

interface SupabaseProfileRow {
  id: string
  email: string
  role: AuthProfile['role']
}

interface SupabaseProfileQueryBuilder {
  select: (columns: string) => {
    eq: (column: string, value: string) => Promise<{
      data: SupabaseProfileRow[] | null
      error: unknown | null
    }>
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallbackMessage
}

export function createProfileServiceFromSupabaseClient(
  client: Pick<SupabaseClientBootstrap, 'from'>
): ProfileService {
  return createProfileService({
    profiles: {
      async getByUserId(userId: string): Promise<AuthProfile | null> {
        const profiles = client.from('profiles') as SupabaseProfileQueryBuilder
        const result = await profiles.select('id,email,role').eq('id', userId)

        if (result.error) {
          throw new Error(getErrorMessage(result.error, 'Failed to load authenticated user profile'))
        }

        return result.data?.[0] ?? null
      },
    },
  })
}

export function createProfileService(deps: ProfileServiceDependencies): ProfileService {
  return {
    async getRequiredProfile(userId: string): Promise<AuthProfile> {
      const profile = await deps.profiles.getByUserId(userId)

      if (!profile) {
        throw new Error(`Missing profile for authenticated user ${userId}`)
      }

      return profile
    },
  }
}
