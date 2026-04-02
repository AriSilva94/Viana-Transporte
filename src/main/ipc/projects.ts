import { eq, like, and, sum } from 'drizzle-orm'
import { db } from '../db'
import { projects, clients, dailyLogs, projectCosts, projectRevenues } from '../db/schema'
import type { Project, ProjectFilters } from '../../shared/types'
import { parseLocalDate } from '../../shared/date'
import { handleRead, handleWrite } from './guarded'

export function registerProjectsHandlers(): void {
  handleRead('projects:list', async (_, filters?: ProjectFilters) => {
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

  handleRead('projects:get', async (_, id: number) => {
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

  handleWrite(
    'projects:create',
    async (_, data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const rows = await db
        .insert(projects)
        .values({
          ...data,
          startDate: data.startDate ? parseLocalDate(data.startDate) : null,
          endDate: data.endDate ? parseLocalDate(data.endDate) : null,
        })
        .returning()
      return rows[0]
    }
  )

  handleWrite(
    'projects:update',
    async (_, id: number, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const rows = await db
        .update(projects)
        .set({
          ...data,
          startDate: data.startDate ? parseLocalDate(data.startDate) : data.startDate,
          endDate: data.endDate ? parseLocalDate(data.endDate) : data.endDate,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning()
      return rows[0]
    }
  )

  handleWrite('projects:delete', async (_, id: number) => {
    await db.delete(projects).where(eq(projects.id, id))
  })

  handleRead('projects:summary', async (_, id: number) => {
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
