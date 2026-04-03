export type DataProvider = 'sqlite' | 'supabase'

export function resolveDataProviderFromEnv(envProvider = process.env.MIGHTYREPT_DATA_PROVIDER): DataProvider {
  return envProvider === 'supabase' ? 'supabase' : 'sqlite'
}
