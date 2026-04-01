import { ipcMain } from 'electron'
import { eq, like, and } from 'drizzle-orm'
import { db } from '../db'
import { operators } from '../db/schema'
import type { Operator } from '../../shared/types'

export function registerOperatorsHandlers(): void {
  ipcMain.handle(
    'operators:list',
    async (_, filters?: { search?: string; isActive?: boolean }) => {
      const conditions = []
      if (filters?.search) conditions.push(like(operators.name, `%${filters.search}%`))
      if (filters?.isActive !== undefined) {
        conditions.push(eq(operators.isActive, filters.isActive))
      }

      if (conditions.length === 0) return db.select().from(operators)
      return db.select().from(operators).where(and(...conditions))
    }
  )

  ipcMain.handle('operators:get', async (_, id: number) => {
    const rows = await db.select().from(operators).where(eq(operators.id, id)).limit(1)
    return rows[0] ?? null
  })

  ipcMain.handle(
    'operators:create',
    async (_, data: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>) => {
      const rows = await db.insert(operators).values(data).returning()
      return rows[0]
    }
  )

  ipcMain.handle(
    'operators:update',
    async (_, id: number, data: Partial<Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const rows = await db
        .update(operators)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(operators.id, id))
        .returning()
      return rows[0]
    }
  )

  ipcMain.handle('operators:delete', async (_, id: number) => {
    await db.delete(operators).where(eq(operators.id, id))
  })
}
