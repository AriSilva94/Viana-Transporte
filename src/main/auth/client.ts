export interface SupabaseAuthClientBootstrap {
  auth: {
    getSession: () => Promise<unknown>
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<unknown>
    signUp: (credentials: { email: string; password: string; options?: { emailRedirectTo?: string } }) => Promise<unknown>
    resetPasswordForEmail: (
      email: string,
      options?: { redirectTo?: string }
    ) => Promise<unknown>
    updateUser: (attributes: { password: string }) => Promise<unknown>
    signOut: () => Promise<unknown>
  }
}

type SupabaseJsModule = {
  createClient: (
    url: string,
    anonKey: string,
    options: { auth: { persistSession: false } }
  ) => SupabaseAuthClientBootstrap
}

function createMissingSupabaseAuthEnvError(name: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'): Error {
  return new Error(`Missing ${name}`)
}

async function loadSupabaseJsModule(): Promise<SupabaseJsModule> {
  return import('@supabase/supabase-js') as unknown as Promise<SupabaseJsModule>
}

export async function createSupabaseAuthClientFromEnv(): Promise<SupabaseAuthClientBootstrap> {
  const url = process.env.SUPABASE_URL?.trim()
  if (!url) {
    throw createMissingSupabaseAuthEnvError('SUPABASE_URL')
  }

  const anonKey = process.env.SUPABASE_ANON_KEY?.trim()
  if (!anonKey) {
    throw createMissingSupabaseAuthEnvError('SUPABASE_ANON_KEY')
  }

  const { createClient } = await loadSupabaseJsModule()
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  }) as SupabaseAuthClientBootstrap
}
