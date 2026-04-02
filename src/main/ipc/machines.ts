import { eq, like, and, or } from 'drizzle-orm'
import { db } from '../db'
import { machines } from '../db/schema'
import type { Machine } from '../../shared/types'
import { handleRead, handleWrite } from './guarded'

export function registerMachinesHandlers(): void {
  handleRead(
    'machines:list',
    async (_, filters?: { search?: string; status?: Machine['status'] }) => {
      const conditions = []
      if (filters?.search) {
        conditions.push(
          or(
            like(machines.name, `%${filters.search}%`),
            like(machines.type, `%${filters.search}%`)
          )!
        )
      }
      if (filters?.status) conditions.push(eq(machines.status, filters.status))

      if (conditions.length === 0) return db.select().from(machines)
      return db.select().from(machines).where(and(...conditions))
    }
  )

  handleRead('machines:get', async (_, id: number) => {
    const rows = await db.select().from(machines).where(eq(machines.id, id)).limit(1)
    return rows[0] ?? null
  })

  handleWrite(
    'machines:create',
    async (_, data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) => {
      const rows = await db.insert(machines).values(data).returning()
      return rows[0]
    }
  )

  handleWrite(
    'machines:update',
    async (_, id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const rows = await db
        .update(machines)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(machines.id, id))
        .returning()
      return rows[0]
    }
  )

  handleWrite('machines:delete', async (_, id: number) => {
    await db.delete(machines).where(eq(machines.id, id))
  })
}
