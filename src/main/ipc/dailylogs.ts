import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../db'
import { dailyLogs, projects, machines, operators } from '../db/schema'
import type { DailyLog, DailyLogFilters } from '../../shared/types'
import { endOfLocalDay, parseLocalDate } from '../../shared/date'
import { handleRead, handleWrite } from './guarded'

const selectedFields = {
  id: dailyLogs.id,
  date: dailyLogs.date,
  projectId: dailyLogs.projectId,
  machineId: dailyLogs.machineId,
  operatorId: dailyLogs.operatorId,
  hoursWorked: dailyLogs.hoursWorked,
  workDescription: dailyLogs.workDescription,
  fuelQuantity: dailyLogs.fuelQuantity,
  downtimeNotes: dailyLogs.downtimeNotes,
  notes: dailyLogs.notes,
  createdAt: dailyLogs.createdAt,
  updatedAt: dailyLogs.updatedAt,
  projectName: projects.name,
  machineName: machines.name,
  operatorName: operators.name,
}

export function registerDailyLogsHandlers(): void {
  handleRead('dailylogs:list', async (_, filters?: DailyLogFilters) => {
    const conditions = []

    if (filters?.projectId) conditions.push(eq(dailyLogs.projectId, filters.projectId))
    if (filters?.machineId) conditions.push(eq(dailyLogs.machineId, filters.machineId))
    if (filters?.operatorId) conditions.push(eq(dailyLogs.operatorId, filters.operatorId))
    if (filters?.dateFrom) conditions.push(gte(dailyLogs.date, parseLocalDate(filters.dateFrom)))
    if (filters?.dateTo) conditions.push(lte(dailyLogs.date, endOfLocalDay(filters.dateTo)))

    const baseQuery = db
      .select(selectedFields)
      .from(dailyLogs)
      .leftJoin(projects, eq(dailyLogs.projectId, projects.id))
      .leftJoin(machines, eq(dailyLogs.machineId, machines.id))
      .leftJoin(operators, eq(dailyLogs.operatorId, operators.id))

    if (conditions.length === 0) return baseQuery
    return baseQuery.where(and(...conditions))
  })

  handleRead('dailylogs:get', async (_, id: number) => {
    const rows = await db
      .select(selectedFields)
      .from(dailyLogs)
      .leftJoin(projects, eq(dailyLogs.projectId, projects.id))
      .leftJoin(machines, eq(dailyLogs.machineId, machines.id))
      .leftJoin(operators, eq(dailyLogs.operatorId, operators.id))
      .where(eq(dailyLogs.id, id))
      .limit(1)
    return rows[0] ?? null
  })

  handleWrite(
    'dailylogs:create',
    async (_, data: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => {
      const rows = await db
        .insert(dailyLogs)
        .values({
          ...data,
          date: parseLocalDate(data.date),
        })
        .returning()
      return rows[0]
    }
  )

  handleWrite(
    'dailylogs:update',
    async (_, id: number, data: Partial<Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const payload: typeof data & { updatedAt: Date; date?: Date } = {
        ...data,
        updatedAt: new Date(),
      }
      if (data.date) payload.date = parseLocalDate(data.date)

      const rows = await db
        .update(dailyLogs)
        .set(payload)
        .where(eq(dailyLogs.id, id))
        .returning()
      return rows[0]
    }
  )

  handleWrite('dailylogs:delete', async (_, id: number) => {
    await db.delete(dailyLogs).where(eq(dailyLogs.id, id))
  })
}
