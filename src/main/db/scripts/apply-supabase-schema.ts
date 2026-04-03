import { readFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { join } from 'path'
import { parseCliFlags } from './runtime'

function getDatabaseUrl(): string {
  const databaseUrl = process.env.SUPABASE_DATABASE_URL?.trim() ?? process.env.DATABASE_URL?.trim()

  if (!databaseUrl) {
    throw new Error('Missing SUPABASE_DATABASE_URL or DATABASE_URL')
  }

  return databaseUrl
}

function main(): void {
  const flags = parseCliFlags(process.argv.slice(2))
  const schemaPath = join(process.cwd(), 'src/main/db/sql/supabase-schema.sql')
  const sql = readFileSync(schemaPath, 'utf-8')

  console.log(`[schema] loaded ${schemaPath} (${sql.length} bytes)`)

  if (flags.dryRun) {
    console.log('[schema] dry run only. Re-run with --apply to execute against Supabase.')
    return
  }

  const result = spawnSync(
    'psql',
    ['-v', 'ON_ERROR_STOP=1', '-d', getDatabaseUrl(), '-f', schemaPath],
    { stdio: 'inherit' }
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`psql exited with status ${result.status ?? 'unknown'}`)
  }
}

main()
