import { initDb } from '../db'
import type { DataProvider } from './types'

export function resolveDataProviderFromEnv(): DataProvider {
  return process.env.MIGHTYREPT_DATA_PROVIDER === 'supabase' ? 'supabase' : 'sqlite'
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
