import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../db'
import { projectRevenues, projects } from '../db/schema'
import type { ProjectRevenue, RevenueFilters } from '../../shared/types'
import { endOfLocalDay, parseLocalDate } from '../../shared/date'
import { handleRead, handleWrite } from './guarded'

const selectedFields = {
  id: projectRevenues.id,
  date: projectRevenues.date,
  projectId: projectRevenues.projectId,
  description: projectRevenues.description,
  amount: projectRevenues.amount,
  status: projectRevenues.status,
  notes: projectRevenues.notes,
  createdAt: projectRevenues.createdAt,
  updatedAt: projectRevenues.updatedAt,
  projectName: projects.name,
}

export function registerRevenuesHandlers(): void {
  handleRead('revenues:list', async (_, filters?: RevenueFilters) => {
    const conditions = []

    if (filters?.projectId) conditions.push(eq(projectRevenues.projectId, filters.projectId))
    if (filters?.status) conditions.push(eq(projectRevenues.status, filters.status as ProjectRevenue['status']))
    if (filters?.dateFrom) conditions.push(gte(projectRevenues.date, parseLocalDate(filters.dateFrom)))
    if (filters?.dateTo) conditions.push(lte(projectRevenues.date, endOfLocalDay(filters.dateTo)))

    const baseQuery = db
      .select(selectedFields)
      .from(projectRevenues)
      .leftJoin(projects, eq(projectRevenues.projectId, projects.id))

    if (conditions.length === 0) return baseQuery
    return baseQuery.where(and(...conditions))
  })

  handleRead('revenues:get', async (_, id: number) => {
    const rows = await db
      .select(selectedFields)
      .from(projectRevenues)
      .leftJoin(projects, eq(projectRevenues.projectId, projects.id))
      .where(eq(projectRevenues.id, id))
      .limit(1)
    return rows[0] ?? null
  })

  handleWrite(
    'revenues:create',
    async (_, data: Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>) => {
      const rows = await db
        .insert(projectRevenues)
        .values({
          ...data,
          date: parseLocalDate(data.date),
        })
        .returning()
      return rows[0]
    }
  )

  handleWrite(
    'revenues:update',
    async (_, id: number, data: Partial<Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const payload: typeof data & { updatedAt: Date; date?: Date } = {
        ...data,
        updatedAt: new Date(),
      }
      if (data.date) payload.date = parseLocalDate(data.date)

      const rows = await db
        .update(projectRevenues)
        .set(payload)
        .where(eq(projectRevenues.id, id))
        .returning()
      return rows[0]
    }
  )

  handleWrite('revenues:delete', async (_, id: number) => {
    await db.delete(projectRevenues).where(eq(projectRevenues.id, id))
  })
}
