import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { createBootstrapAdminOwnership } from './bootstrap-admin-ownership'
import type { OperationalTable } from './bootstrap-admin-ownership'

config()

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = process.env.ADMIN_EMAIL

if (!supabaseUrl || !serviceRoleKey || !adminEmail) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const script = createBootstrapAdminOwnership({
  async listUsers() {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw new Error(`Failed to list users: ${error.message}`)
    return data.users.map((u) => ({ id: u.id, email: u.email ?? null }))
  },

  async upsertProfile(input) {
    const { error } = await supabase.from('profiles').upsert(
      { id: input.id, email: input.email, role: input.role },
      { onConflict: 'id' }
    )
    if (error) throw new Error(`Failed to upsert profile: ${error.message}`)
  },

  async backfillTable(table: OperationalTable, userId: string) {
    const { error } = await supabase
      .from(table)
      .update({ user_id: userId })
      .is('user_id', null)
    if (error) throw new Error(`Failed to backfill ${table}: ${error.message}`)
  },

  async setNotNull(table: OperationalTable) {
    const { error } = await supabase.rpc('exec_sql', {
      query: `alter table public.${table} alter column user_id set not null`,
    })
    if (error) {
      console.warn(`Warning: could not set NOT NULL on ${table}.user_id (may need manual SQL): ${error.message}`)
    }
  },

  async countNulls(table: OperationalTable) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .is('user_id', null)
    if (error) throw new Error(`Failed to count nulls in ${table}: ${error.message}`)
    return count ?? 0
  },
})

async function main() {
  console.log(`\nBootstrapping admin ownership for: ${adminEmail}`)
  console.log('---')

  try {
    const result = await script.run({ adminEmail, adminRole: 'admin' })
    console.log(`\nAdmin user ID: ${result.adminId}`)
    console.log(`Tables updated: ${result.tablesUpdated.join(', ')}`)
    console.log('\nBootstrap completed successfully!')
  } catch (err) {
    console.error('\nBootstrap failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
