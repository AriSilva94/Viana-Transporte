import type { AuthProfile } from '../../shared/types'

export interface ProfileRepository {
  getByUserId: (userId: string) => Promise<AuthProfile | null>
}

export interface ProfileServiceDependencies {
  profiles: ProfileRepository
}

export interface ProfileService {
  getRequiredProfile: (userId: string) => Promise<AuthProfile>
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
