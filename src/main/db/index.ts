import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { join } from 'path'
import { app } from 'electron'
import * as schema from './schema'

function getDbUrl(): string {
  const dbPath = app.isPackaged
    ? join(app.getPath('userData'), 'mightyrept.db')
    : join(app.getAppPath(), 'dev.db')
  return `file:${dbPath}`
}

function getMigrationsFolder(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : join(app.getAppPath(), 'src/main/db/migrations')
}

export type DB = ReturnType<typeof drizzle<typeof schema>>
export let db: DB

export async function initDb(): Promise<void> {
  const client = createClient({ url: getDbUrl() })
  db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: getMigrationsFolder() })
}
