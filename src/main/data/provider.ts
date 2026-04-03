import type { DataProvider } from './types'

export function resolveDataProviderFromEnv(): DataProvider {
  return process.env.MIGHTYREPT_DATA_PROVIDER === 'supabase' ? 'supabase' : 'sqlite'
}
