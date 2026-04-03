import type { DataProvider, DomainRepository } from './types'
import { createSupabaseRepository } from './supabase/repository'

let repository: DomainRepository | null = null

export function resolveDataProviderFromEnv(): DataProvider {
  return 'supabase'
}

export async function initDataProvider(provider: DataProvider): Promise<DataProvider> {
  if (provider !== 'supabase') {
    throw new Error('This build supports only Supabase as data provider.')
  }

  repository = null

  try {
    const nextRepository = await createSupabaseRepository()
    repository = nextRepository
    return 'supabase'
  } catch (error) {
    repository = null
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to initialize Supabase data provider: ${message}`)
  }
}

export function getRepository(): DomainRepository {
  if (!repository) {
    throw new Error('Data repository has not been initialized')
  }

  return repository
}
