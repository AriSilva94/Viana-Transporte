import { eq, like } from 'drizzle-orm'
import { db } from '../db'
import { clients } from '../db/schema'
import type { Client } from '../../shared/types'
import { handleRead, handleWrite } from './guarded'

export function registerClientsHandlers(): void {
  handleRead('clients:list', async (_, filters?: { search?: string }) => {
    if (filters?.search) {
      return db.select().from(clients).where(like(clients.name, `%${filters.search}%`))
    }
    return db.select().from(clients)
  })

  handleRead('clients:get', async (_, id: number) => {
    const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1)
    return rows[0] ?? null
  })

  handleWrite(
    'clients:create',
    async (_, data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
      const rows = await db.insert(clients).values(data).returning()
      return rows[0]
    }
  )

  handleWrite(
    'clients:update',
    async (_, id: number, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const rows = await db
        .update(clients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clients.id, id))
        .returning()
      return rows[0]
    }
  )

  handleWrite('clients:delete', async (_, id: number) => {
    await db.delete(clients).where(eq(clients.id, id))
  })
}
