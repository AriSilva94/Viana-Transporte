import { ipcMain } from 'electron'
import { eq, like, and, sum } from 'drizzle-orm'
import { db } from '../db'
import { projects, clients, dailyLogs, projectCosts, projectRevenues } from '../db/schema'
import type { Project, ProjectFilters } from '../../shared/types'

export function registerProjectsHandlers(): void {
  ipcMain.handle('projects:list', async (_, filters?: ProjectFilters) => {
    const conditions = []
    if (filters?.search) conditions.push(like(projects.name, `%${filters.search}%`))
    if (filters?.status) conditions.push(eq(projects.status, filters.status))
    if (filters?.clientId) conditions.push(eq(projects.clientId, filters.clientId))

    const baseQuery = db
      .select({
        id: projects.id,
        clientId: projects.clientId,
        name: projects.name,
        location: projects.location,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        contractAmount: projects.contractAmount,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientName: clients.name,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))

    if (conditions.length === 0) return baseQuery
    return baseQuery.where(and(...conditions))
  })

  ipcMain.handle('projects:get', async (_, id: number) => {
    const rows = await db
      .select({
        id: projects.id,
        clientId: projects.clientId,
        name: projects.name,
        location: projects.location,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        contractAmount: projects.contractAmount,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientName: clients.name,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.id, id))
      .limit(1)
    return rows[0] ?? null
  })

  ipcMain.handle(
    'projects:create',
    async (_, data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const rows = await db.insert(projects).values(data).returning()
      return rows[0]
    }
  )

  ipcMain.handle(
    'projects:update',
    async (_, id: number, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const rows = await db
        .update(projects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning()
      return rows[0]
    }
  )

  ipcMain.handle('projects:delete', async (_, id: number) => {
    await db.delete(projects).where(eq(projects.id, id))
  })

  ipcMain.handle('projects:summary', async (_, id: number) => {
    const [costsRow] = await db
      .select({ total: sum(projectCosts.amount) })
      .from(projectCosts)
      .where(eq(projectCosts.projectId, id))

    const [revenuesRow] = await db
      .select({ total: sum(projectRevenues.amount) })
      .from(projectRevenues)
      .where(eq(projectRevenues.projectId, id))

    const [hoursRow] = await db
      .select({ total: sum(dailyLogs.hoursWorked) })
      .from(dailyLogs)
      .where(eq(dailyLogs.projectId, id))

    const totalCosts = Number(costsRow?.total ?? 0)
    const totalRevenues = Number(revenuesRow?.total ?? 0)
    return {
      totalCosts,
      totalRevenues,
      profit: totalRevenues - totalCosts,
      totalHours: Number(hoursRow?.total ?? 0),
    }
  })
}
