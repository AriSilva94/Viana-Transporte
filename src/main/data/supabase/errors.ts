export function createMissingSupabaseEnvError(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): Error {
  return new Error(`Missing ${name}`)
}

export function createSupabaseRepositoryNotImplementedError(operation: string): Error {
  return new Error(`Supabase repository not implemented yet: ${operation}`)
}
