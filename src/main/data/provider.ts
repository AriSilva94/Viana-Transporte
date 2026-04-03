import { db, initDb } from '../db'
import type { DataProvider, DomainRepository } from './types'
import { createSqliteRepository } from './sqlite/repository'
import { createSupabaseRepository } from './supabase/repository'

let repository: DomainRepository | null = null

export function resolveDataProviderFromEnv(): DataProvider {
  const rawProvider = process.env.MIGHTYREPT_DATA_PROVIDER?.trim()

  if (!rawProvider) {
    return 'sqlite'
  }

  if (rawProvider === 'sqlite' || rawProvider === 'supabase') {
    return rawProvider
  }

  throw new Error('Invalid MIGHTYREPT_DATA_PROVIDER value. Supported values: sqlite, supabase.')
}

export async function initDataProvider(provider: DataProvider): Promise<DataProvider> {
  repository = null

  if (provider === 'supabase') {
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

  await initDb()
  const nextRepository = createSqliteRepository(db)
  repository = nextRepository
  return 'sqlite'
}

export function getRepository(): DomainRepository {
  if (!repository) {
    throw new Error('Data repository has not been initialized')
  }

  return repository
}
