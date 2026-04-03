import { initDb } from '../db'
import type { DataProvider } from './types'

export function resolveDataProviderFromEnv(): DataProvider {
  return process.env.MIGHTYREPT_DATA_PROVIDER === 'supabase' ? 'supabase' : 'sqlite'
}

export async function initDataProvider(provider: DataProvider): Promise<DataProvider> {
  if (provider === 'supabase') {
    throw new Error('Supabase provider is not implemented yet')
  }

  await initDb()
  return 'sqlite'
}
