import { ipcMain } from 'electron'
import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../db'
import { projectCosts, projects, machines, operators } from '../db/schema'
import type { ProjectCost, CostFilters } from '../../shared/types'
import { endOfLocalDay, parseLocalDate } from '../../shared/date'

const selectedFields = {
  id: projectCosts.id,
  date: projectCosts.date,
  projectId: projectCosts.projectId,
  machineId: projectCosts.machineId,
  operatorId: projectCosts.operatorId,
  category: projectCosts.category,
  description: projectCosts.description,
  amount: projectCosts.amount,
  notes: projectCosts.notes,
  createdAt: projectCosts.createdAt,
  updatedAt: projectCosts.updatedAt,
  projectName: projects.name,
  machineName: machines.name,
  operatorName: operators.name,
}

export function registerCostsHandlers(): void {
  ipcMain.handle('costs:list', async (_, filters?: CostFilters) => {
    const conditions = []

    if (filters?.projectId) conditions.push(eq(projectCosts.projectId, filters.projectId))
    if (filters?.category) conditions.push(eq(projectCosts.category, filters.category as ProjectCost['category']))
    if (filters?.dateFrom) conditions.push(gte(projectCosts.date, parseLocalDate(filters.dateFrom)))
    if (filters?.dateTo) conditions.push(lte(projectCosts.date, endOfLocalDay(filters.dateTo)))

    const baseQuery = db
      .select(selectedFields)
      .from(projectCosts)
      .leftJoin(projects, eq(projectCosts.projectId, projects.id))
      .leftJoin(machines, eq(projectCosts.machineId, machines.id))
      .leftJoin(operators, eq(projectCosts.operatorId, operators.id))

    if (conditions.length === 0) return baseQuery
    return baseQuery.where(and(...conditions))
  })

  ipcMain.handle('costs:get', async (_, id: number) => {
    const rows = await db
      .select(selectedFields)
      .from(projectCosts)
      .leftJoin(projects, eq(projectCosts.projectId, projects.id))
      .leftJoin(machines, eq(projectCosts.machineId, machines.id))
      .leftJoin(operators, eq(projectCosts.operatorId, operators.id))
      .where(eq(projectCosts.id, id))
      .limit(1)
    return rows[0] ?? null
  })

  ipcMain.handle(
    'costs:create',
    async (_, data: Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>) => {
      const rows = await db
        .insert(projectCosts)
        .values({
          ...data,
          date: parseLocalDate(data.date),
        })
        .returning()
      return rows[0]
    }
  )

  ipcMain.handle(
    'costs:update',
    async (_, id: number, data: Partial<Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const payload: typeof data & { updatedAt: Date; date?: Date } = {
        ...data,
        updatedAt: new Date(),
      }
      if (data.date) payload.date = parseLocalDate(data.date)

      const rows = await db
        .update(projectCosts)
        .set(payload)
        .where(eq(projectCosts.id, id))
        .returning()
      return rows[0]
    }
  )

  ipcMain.handle('costs:delete', async (_, id: number) => {
    await db.delete(projectCosts).where(eq(projectCosts.id, id))
  })
}
