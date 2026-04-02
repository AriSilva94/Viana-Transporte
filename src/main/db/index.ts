import { createClient } from '@libsql/client/sqlite3'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { join } from 'path'
import { app } from 'electron'
import * as schema from './schema'
import { resolveDbPath } from '../../shared/db-path'

function getDbUrl(): string {
  const dbPath = resolveDbPath({
    appPath: app.getAppPath(),
    userDataPath: app.getPath('userData'),
    isPackaged: app.isPackaged,
    envDbPath: process.env.MIGHTYREPT_DB_PATH,
  })
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
