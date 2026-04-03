import { createClient } from '@libsql/client/sqlite3'
import { and, eq, like, or } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import type { DB } from '../../db'
import * as schema from '../../db/schema'
import { clients, machines, operators } from '../../db/schema'
import type { Client, Machine, Operator } from '../../../shared/types'
import type { DomainRepository } from '../types'

function createDomainRepository(db: DB): DomainRepository {
  return {
    clients: {
      async list(filters?: { search?: string }) {
        const search = filters?.search?.trim()

        if (search) {
          return db.select().from(clients).where(like(clients.name, `%${search}%`))
        }

        return db.select().from(clients)
      },
      async get(id: number) {
        const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1)
        return rows[0] ?? null
      },
      async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
        const rows = await db.insert(clients).values(data).returning()
        return rows[0]
      },
      async update(id: number, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) {
        const rows = await db
          .update(clients)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(clients.id, id))
          .returning()

        if (!rows[0]) {
          throw new Error('Client not found')
        }

        return rows[0]
      },
      async delete(id: number) {
        await db.delete(clients).where(eq(clients.id, id))
      },
    },
    machines: {
      async list(filters?: { search?: string; status?: Machine['status'] }) {
        const search = filters?.search?.trim()
        const conditions = []

        if (search) {
          conditions.push(
            or(like(machines.name, `%${search}%`), like(machines.type, `%${search}%`))!
          )
        }

        if (filters?.status) {
          conditions.push(eq(machines.status, filters.status))
        }

        if (conditions.length === 0) {
          return db.select().from(machines)
        }

        return db.select().from(machines).where(and(...conditions))
      },
      async get(id: number) {
        const rows = await db.select().from(machines).where(eq(machines.id, id)).limit(1)
        return rows[0] ?? null
      },
      async create(data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) {
        const rows = await db.insert(machines).values(data).returning()
        return rows[0]
      },
      async update(id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>) {
        const rows = await db
          .update(machines)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(machines.id, id))
          .returning()

        if (!rows[0]) {
          throw new Error('Machine not found')
        }

        return rows[0]
      },
      async delete(id: number) {
        await db.delete(machines).where(eq(machines.id, id))
      },
    },
    operators: {
      async list(filters?: { search?: string; isActive?: boolean }) {
        const search = filters?.search?.trim()
        const conditions = []

        if (search) {
          conditions.push(like(operators.name, `%${search}%`))
        }

        if (filters?.isActive !== undefined) {
          conditions.push(eq(operators.isActive, filters.isActive))
        }

        if (conditions.length === 0) {
          return db.select().from(operators)
        }

        return db.select().from(operators).where(and(...conditions))
      },
      async get(id: number) {
        const rows = await db.select().from(operators).where(eq(operators.id, id)).limit(1)
        return rows[0] ?? null
      },
      async create(data: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>) {
        const rows = await db.insert(operators).values(data).returning()
        return rows[0]
      },
      async update(id: number, data: Partial<Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>>) {
        const rows = await db
          .update(operators)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(operators.id, id))
          .returning()

        if (!rows[0]) {
          throw new Error('Operator not found')
        }

        return rows[0]
      },
      async delete(id: number) {
        await db.delete(operators).where(eq(operators.id, id))
      },
    },
  }
}

export function createSqliteRepository(db: DB): DomainRepository {
  return createDomainRepository(db)
}

export async function createSqliteRepositoryForTest(): Promise<DomainRepository> {
  const tempDir = await mkdtemp(join(tmpdir(), 'mightyrept-sqlite-repo-'))
  const client = createClient({ url: `file:${join(tempDir, 'test.db')}` })
  const db = drizzle(client, { schema })

  await migrate(db, {
    migrationsFolder: join(process.cwd(), 'src/main/db/migrations'),
  })

  return createDomainRepository(db as DB)
}
