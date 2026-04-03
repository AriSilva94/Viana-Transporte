import { initDb } from '../db'
import type { DataProvider } from './types'

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
  if (provider === 'supabase') {
    throw new Error('Supabase provider is not implemented yet')
  }

  await initDb()
  return 'sqlite'
}
