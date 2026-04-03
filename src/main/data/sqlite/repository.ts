import { createClient } from '@libsql/client/sqlite3'
import { and, eq, gte, like, lte, or, sum } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import type { DB } from '../../db'
import * as schema from '../../db/schema'
import { clients, dailyLogs, machines, operators, projects, projectCosts, projectRevenues } from '../../db/schema'
import type {
  Client,
  CostFilters,
  DailyLog,
  DailyLogFilters,
  Machine,
  Operator,
  Project,
  ProjectCost,
  ProjectFilters,
  ProjectRevenue,
  RevenueFilters,
} from '../../../shared/types'
import type { DomainRepository } from '../types'
import { endOfLocalDay, parseLocalDate } from '../../../shared/date'

const projectSelectFields = {
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
}

const dailyLogSelectFields = {
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

const costSelectFields = {
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

const revenueSelectFields = {
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
    projects: {
      async list(filters?: ProjectFilters) {
        const conditions = []

        if (filters?.search?.trim()) {
          conditions.push(like(projects.name, `%${filters.search.trim()}%`))
        }

        if (filters?.status) {
          conditions.push(eq(projects.status, filters.status))
        }

        if (filters?.clientId) {
          conditions.push(eq(projects.clientId, filters.clientId))
        }

        const baseQuery = db
          .select(projectSelectFields)
          .from(projects)
          .leftJoin(clients, eq(projects.clientId, clients.id))

        return conditions.length === 0 ? baseQuery : baseQuery.where(and(...conditions))
      },
      async get(id: number) {
        const rows = await db
          .select(projectSelectFields)
          .from(projects)
          .leftJoin(clients, eq(projects.clientId, clients.id))
          .where(eq(projects.id, id))
          .limit(1)

        return rows[0] ?? null
      },
      async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
        const rows = await db
          .insert(projects)
          .values({
            ...data,
            startDate: data.startDate ? parseLocalDate(data.startDate) : null,
            endDate: data.endDate ? parseLocalDate(data.endDate) : null,
          })
          .returning()

        return rows[0]
      },
      async update(id: number, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) {
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

        if (!rows[0]) {
          throw new Error('Project not found')
        }

        return rows[0]
      },
      async delete(id: number) {
        await db.delete(projects).where(eq(projects.id, id))
      },
      async summary(id: number) {
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
    dailylogs: {
      async list(filters?: DailyLogFilters) {
        const conditions = []

        if (filters?.projectId) conditions.push(eq(dailyLogs.projectId, filters.projectId))
        if (filters?.machineId) conditions.push(eq(dailyLogs.machineId, filters.machineId))
        if (filters?.operatorId) conditions.push(eq(dailyLogs.operatorId, filters.operatorId))
        if (filters?.dateFrom) conditions.push(gte(dailyLogs.date, parseLocalDate(filters.dateFrom)))
        if (filters?.dateTo) conditions.push(lte(dailyLogs.date, endOfLocalDay(filters.dateTo)))

        const baseQuery = db
          .select(dailyLogSelectFields)
          .from(dailyLogs)
          .leftJoin(projects, eq(dailyLogs.projectId, projects.id))
          .leftJoin(machines, eq(dailyLogs.machineId, machines.id))
          .leftJoin(operators, eq(dailyLogs.operatorId, operators.id))

        return conditions.length === 0 ? baseQuery : baseQuery.where(and(...conditions))
      },
      async get(id: number) {
        const rows = await db
          .select(dailyLogSelectFields)
          .from(dailyLogs)
          .leftJoin(projects, eq(dailyLogs.projectId, projects.id))
          .leftJoin(machines, eq(dailyLogs.machineId, machines.id))
          .leftJoin(operators, eq(dailyLogs.operatorId, operators.id))
          .where(eq(dailyLogs.id, id))
          .limit(1)

        return rows[0] ?? null
      },
      async create(data: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) {
        const rows = await db
          .insert(dailyLogs)
          .values({
            ...data,
            date: parseLocalDate(data.date),
          })
          .returning()

        return rows[0]
      },
      async update(id: number, data: Partial<Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>>) {
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

        if (!rows[0]) {
          throw new Error('Daily log not found')
        }

        return rows[0]
      },
      async delete(id: number) {
        await db.delete(dailyLogs).where(eq(dailyLogs.id, id))
      },
    },
    costs: {
      async list(filters?: CostFilters) {
        const conditions = []

        if (filters?.projectId) conditions.push(eq(projectCosts.projectId, filters.projectId))
        if (filters?.category) conditions.push(eq(projectCosts.category, filters.category))
        if (filters?.dateFrom) conditions.push(gte(projectCosts.date, parseLocalDate(filters.dateFrom)))
        if (filters?.dateTo) conditions.push(lte(projectCosts.date, endOfLocalDay(filters.dateTo)))

        const baseQuery = db
          .select(costSelectFields)
          .from(projectCosts)
          .leftJoin(projects, eq(projectCosts.projectId, projects.id))
          .leftJoin(machines, eq(projectCosts.machineId, machines.id))
          .leftJoin(operators, eq(projectCosts.operatorId, operators.id))

        return conditions.length === 0 ? baseQuery : baseQuery.where(and(...conditions))
      },
      async get(id: number) {
        const rows = await db
          .select(costSelectFields)
          .from(projectCosts)
          .leftJoin(projects, eq(projectCosts.projectId, projects.id))
          .leftJoin(machines, eq(projectCosts.machineId, machines.id))
          .leftJoin(operators, eq(projectCosts.operatorId, operators.id))
          .where(eq(projectCosts.id, id))
          .limit(1)

        return rows[0] ?? null
      },
      async create(data: Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>) {
        const rows = await db
          .insert(projectCosts)
          .values({
            ...data,
            date: parseLocalDate(data.date),
          })
          .returning()

        return rows[0]
      },
      async update(id: number, data: Partial<Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>>) {
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

        if (!rows[0]) {
          throw new Error('Cost not found')
        }

        return rows[0]
      },
      async delete(id: number) {
        await db.delete(projectCosts).where(eq(projectCosts.id, id))
      },
    },
    revenues: {
      async list(filters?: RevenueFilters) {
        const conditions = []

        if (filters?.projectId) conditions.push(eq(projectRevenues.projectId, filters.projectId))
        if (filters?.status) conditions.push(eq(projectRevenues.status, filters.status))
        if (filters?.dateFrom) conditions.push(gte(projectRevenues.date, parseLocalDate(filters.dateFrom)))
        if (filters?.dateTo) conditions.push(lte(projectRevenues.date, endOfLocalDay(filters.dateTo)))

        const baseQuery = db
          .select(revenueSelectFields)
          .from(projectRevenues)
          .leftJoin(projects, eq(projectRevenues.projectId, projects.id))

        return conditions.length === 0 ? baseQuery : baseQuery.where(and(...conditions))
      },
      async get(id: number) {
        const rows = await db
          .select(revenueSelectFields)
          .from(projectRevenues)
          .leftJoin(projects, eq(projectRevenues.projectId, projects.id))
          .where(eq(projectRevenues.id, id))
          .limit(1)

        return rows[0] ?? null
      },
      async create(data: Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>) {
        const rows = await db
          .insert(projectRevenues)
          .values({
            ...data,
            date: parseLocalDate(data.date),
          })
          .returning()

        return rows[0]
      },
      async update(id: number, data: Partial<Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>>) {
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

        if (!rows[0]) {
          throw new Error('Revenue not found')
        }

        return rows[0]
      },
      async delete(id: number) {
        await db.delete(projectRevenues).where(eq(projectRevenues.id, id))
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
