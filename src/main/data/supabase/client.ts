import { createMissingSupabaseEnvError } from './errors'

export interface SupabaseClientBootstrap {
  from: (table: string) => unknown
  rpc: (fn: string, params: Record<string, unknown>) => Promise<unknown>
}

type SupabaseJsModule = {
  createClient: (
    url: string,
    serviceRoleKey: string,
    options: { auth: { persistSession: false } }
  ) => SupabaseClientBootstrap
}

async function loadSupabaseJsModule(): Promise<SupabaseJsModule> {
  return import('@supabase/supabase-js') as unknown as Promise<SupabaseJsModule>
}

export async function createSupabaseClientFromEnv(): Promise<SupabaseClientBootstrap> {
  const url = process.env.SUPABASE_URL?.trim()
  if (!url) {
    throw createMissingSupabaseEnvError('SUPABASE_URL')
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceRoleKey) {
    throw createMissingSupabaseEnvError('SUPABASE_SERVICE_ROLE_KEY')
  }

  const { createClient } = await loadSupabaseJsModule()
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  }) as SupabaseClientBootstrap
}
