import { resolveDataProviderFromEnv as resolveSharedDataProviderFromEnv } from '../../shared/data-provider'
import { initDb } from '../db'
import type { DataProvider } from './types'

export function resolveDataProviderFromEnv(): DataProvider {
  return resolveSharedDataProviderFromEnv()
}

export async function initDataProvider(provider: DataProvider): Promise<DataProvider> {
  switch (provider) {
    case 'supabase':
      await initDb()
      return provider
    case 'sqlite':
    default:
      await initDb()
      return 'sqlite'
  }
}
