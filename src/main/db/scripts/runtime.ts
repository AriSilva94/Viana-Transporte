import { createClient } from '@libsql/client/sqlite3'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { join } from 'path'
import type { DB } from '../index'
import * as schema from '../schema'
import { resolveDbPath } from '../../../shared/db-path'
import { createSqliteRepository } from '../../data/sqlite/repository'
import type { DomainRepository } from '../../data/types'
import { loadMainEnv } from '../../config/load-env'

loadMainEnv()

export interface CliFlags {
  apply: boolean
  dryRun: boolean
}

export function parseCliFlags(argv: string[]): CliFlags {
  return {
    apply: argv.includes('--apply'),
    dryRun: argv.includes('--dry-run') || !argv.includes('--apply'),
  }
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export function resolveScriptDbPath(): string {
  return resolveDbPath({
    appPath: process.cwd(),
    userDataPath: process.cwd(),
    isPackaged: false,
    envDbPath: process.env.MIGHTYREPT_DB_PATH ?? process.env.SOURCE_SQLITE_PATH,
  })
}

export async function createSourceSqliteRepository(): Promise<DomainRepository> {
  const client = createClient({ url: `file:${resolveScriptDbPath()}` })
  const db = drizzle(client, { schema })

  await migrate(db, {
    migrationsFolder: join(process.cwd(), 'src/main/db/migrations'),
  })

  return createSqliteRepository(db as DB)
}
