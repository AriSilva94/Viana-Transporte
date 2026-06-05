import type {
  Client,
  CostFilters,
  DailyLog,
  DailyLogFilters,
  DailyLogWithRelations,
  DashboardStats,
  Machine,
  Operator,
  Project,
  ProjectCost,
  ProjectCostWithRelations,
  ProjectFilters,
  ProjectRevenue,
  ProjectRevenueWithRelations,
  ProjectSummary,
  ProjectWithClient,
  RevenueFilters,
} from '../../../shared/types'
import { parseLocalDate } from '../../../shared/date'
import { getAuthService } from '../../auth/runtime'
import { ApiHttpClient } from '../../api/http'
import type { DomainRepository } from '../types'

type ApiEntity = Record<string, unknown>
type ApiQuery = Record<string, unknown>

function createDomainClient(): ApiHttpClient {
  return new ApiHttpClient({
    getAuthState: () => getAuthService().getCurrentState(),
  })
}

function mapDateFields<T extends ApiEntity>(row: T, fields: string[]): T {
  const next: ApiEntity = { ...row }

  for (const field of fields) {
    const value = next[field]
    if (typeof value === 'string') {
      next[field] = field === 'date' || field.endsWith('Date') ? parseLocalDate(value) : new Date(value)
    }
  }

  return next as T
}

function mapNumberFields<T extends ApiEntity>(row: T, fields: string[]): T {
  const next: ApiEntity = { ...row }

  for (const field of fields) {
    const value = next[field]
    if (value === null || value === undefined) {
      continue
    }

    const numericValue = Number(value)
    next[field] = Number.isFinite(numericValue) ? numericValue : 0
  }

  return next as T
}

function toQuery<T extends object>(filters?: T): ApiQuery | undefined {
  return filters ? ({ ...filters } as ApiQuery) : undefined
}

function mapClient(row: Client & ApiEntity): Client {
  return mapDateFields(row, ['createdAt', 'updatedAt']) as Client
}

function mapProject(row: ProjectWithClient & ApiEntity): ProjectWithClient {
  return mapNumberFields(
    mapDateFields(row, ['startDate', 'endDate', 'createdAt', 'updatedAt']),
    ['contractAmount']
  ) as ProjectWithClient
}

function mapMachine(row: Machine & ApiEntity): Machine {
  return mapDateFields(row, ['createdAt', 'updatedAt']) as Machine
}

function mapOperator(row: Operator & ApiEntity): Operator {
  return mapDateFields(row, ['createdAt', 'updatedAt']) as Operator
}

function mapDailyLog(row: DailyLogWithRelations & ApiEntity): DailyLogWithRelations {
  return mapNumberFields(mapDateFields(row, ['date', 'createdAt', 'updatedAt']), [
    'hoursWorked',
    'fuelQuantity',
    'km',
    'percentage',
    'toll',
    'tonnage',
  ]) as DailyLogWithRelations
}

function mapCost(row: ProjectCostWithRelations & ApiEntity): ProjectCostWithRelations {
  return mapNumberFields(mapDateFields(row, ['date', 'createdAt', 'updatedAt']), [
    'amount',
    'dailyLogComputedValue',
  ]) as ProjectCostWithRelations
}

function mapRevenue(row: ProjectRevenueWithRelations & ApiEntity): ProjectRevenueWithRelations {
  return mapNumberFields(mapDateFields(row, ['date', 'createdAt', 'updatedAt']), [
    'amount',
    'dailyLogComputedValue',
  ]) as ProjectRevenueWithRelations
}

function mapSummary(row: ProjectSummary): ProjectSummary {
  return {
    totalCosts: Number(row.totalCosts ?? 0),
    totalRevenues: Number(row.totalRevenues ?? 0),
    profit: Number(row.profit ?? 0),
    totalHours: Number(row.totalHours ?? 0),
  }
}

export function createApiRepository(client = createDomainClient()): DomainRepository {
  return {
    clients: {
      async list(filters?: { search?: string }) {
        return (await client.get<Array<Client & ApiEntity>>('/clients', filters)).map(mapClient)
      },
      async get(id: number) {
        return mapClient(await client.get<Client & ApiEntity>(`/clients/${id}`))
      },
      async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
        return mapClient(await client.post<Client & ApiEntity>('/clients', data))
      },
      async update(id: number, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) {
        return mapClient(await client.patch<Client & ApiEntity>(`/clients/${id}`, data))
      },
      async delete(id: number) {
        await client.delete(`/clients/${id}`)
      },
    },
    projects: {
      async list(filters?: ProjectFilters) {
        return (
          await client.get<Array<ProjectWithClient & ApiEntity>>('/projects', toQuery(filters))
        ).map(mapProject)
      },
      async get(id: number) {
        return mapProject(await client.get<ProjectWithClient & ApiEntity>(`/projects/${id}`))
      },
      async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
        return mapProject(await client.post<ProjectWithClient & ApiEntity>('/projects', data))
      },
      async update(id: number, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) {
        return mapProject(await client.patch<ProjectWithClient & ApiEntity>(`/projects/${id}`, data))
      },
      async delete(id: number) {
        await client.delete(`/projects/${id}`)
      },
      async summary(id: number) {
        return mapSummary(await client.get<ProjectSummary>(`/projects/${id}/summary`))
      },
    },
    machines: {
      async list(filters?: { search?: string; status?: Machine['status'] }) {
        return (await client.get<Array<Machine & ApiEntity>>('/machines', filters)).map(mapMachine)
      },
      async get(id: number) {
        return mapMachine(await client.get<Machine & ApiEntity>(`/machines/${id}`))
      },
      async create(data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) {
        return mapMachine(await client.post<Machine & ApiEntity>('/machines', data))
      },
      async update(id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>) {
        return mapMachine(await client.patch<Machine & ApiEntity>(`/machines/${id}`, data))
      },
      async delete(id: number) {
        await client.delete(`/machines/${id}`)
      },
    },
    operators: {
      async list(filters?: { search?: string; isActive?: boolean }) {
        return (await client.get<Array<Operator & ApiEntity>>('/operators', filters)).map(
          mapOperator
        )
      },
      async get(id: number) {
        return mapOperator(await client.get<Operator & ApiEntity>(`/operators/${id}`))
      },
      async create(data: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>) {
        return mapOperator(await client.post<Operator & ApiEntity>('/operators', data))
      },
      async update(id: number, data: Partial<Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>>) {
        return mapOperator(await client.patch<Operator & ApiEntity>(`/operators/${id}`, data))
      },
      async delete(id: number) {
        await client.delete(`/operators/${id}`)
      },
    },
    dailylogs: {
      async list(filters?: DailyLogFilters) {
        return (
          await client.get<Array<DailyLogWithRelations & ApiEntity>>(
            '/daily-logs',
            toQuery(filters)
          )
        ).map(mapDailyLog)
      },
      async get(id: number) {
        return mapDailyLog(await client.get<DailyLogWithRelations & ApiEntity>(`/daily-logs/${id}`))
      },
      async create(data: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) {
        return mapDailyLog(await client.post<DailyLogWithRelations & ApiEntity>('/daily-logs', data))
      },
      async update(id: number, data: Partial<Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>>) {
        return mapDailyLog(
          await client.patch<DailyLogWithRelations & ApiEntity>(`/daily-logs/${id}`, data)
        )
      },
      async delete(id: number) {
        await client.delete(`/daily-logs/${id}`)
      },
    },
    costs: {
      async list(filters?: CostFilters) {
        return (
          await client.get<Array<ProjectCostWithRelations & ApiEntity>>('/costs', toQuery(filters))
        ).map(mapCost)
      },
      async get(id: number) {
        return mapCost(await client.get<ProjectCostWithRelations & ApiEntity>(`/costs/${id}`))
      },
      async create(data: Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>) {
        return mapCost(await client.post<ProjectCostWithRelations & ApiEntity>('/costs', data))
      },
      async update(id: number, data: Partial<Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>>) {
        return mapCost(await client.patch<ProjectCostWithRelations & ApiEntity>(`/costs/${id}`, data))
      },
      async delete(id: number) {
        await client.delete(`/costs/${id}`)
      },
    },
    revenues: {
      async list(filters?: RevenueFilters) {
        return (
          await client.get<Array<ProjectRevenueWithRelations & ApiEntity>>(
            '/revenues',
            toQuery(filters)
          )
        ).map(mapRevenue)
      },
      async get(id: number) {
        return mapRevenue(
          await client.get<ProjectRevenueWithRelations & ApiEntity>(`/revenues/${id}`)
        )
      },
      async create(data: Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>) {
        return mapRevenue(
          await client.post<ProjectRevenueWithRelations & ApiEntity>('/revenues', data)
        )
      },
      async update(
        id: number,
        data: Partial<Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>>
      ) {
        return mapRevenue(
          await client.patch<ProjectRevenueWithRelations & ApiEntity>(`/revenues/${id}`, data)
        )
      },
      async delete(id: number) {
        await client.delete(`/revenues/${id}`)
      },
    },
  }
}

export async function loadDashboardStats(client = createDomainClient()): Promise<DashboardStats> {
  const stats = await client.get<DashboardStats>('/dashboard/stats')

  return {
    ...stats,
    totalCosts: Number(stats.totalCosts ?? 0),
    totalRevenues: Number(stats.totalRevenues ?? 0),
    estimatedProfit: Number(stats.estimatedProfit ?? 0),
    recentLogs: stats.recentLogs.map((log) =>
      mapDailyLog(log as DailyLogWithRelations & ApiEntity)
    ),
  }
}
