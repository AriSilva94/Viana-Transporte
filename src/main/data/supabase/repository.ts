import type { DomainRepository } from '../types'
import { createSupabaseClientFromEnv } from './client'
import {
  mapClientToSupabaseInsert,
  mapDailyLogToSupabaseInsert,
  mapMachineToSupabaseInsert,
  mapProjectCostToSupabaseInsert,
  mapProjectRevenueToSupabaseInsert,
  mapOperatorToSupabaseInsert,
  mapProjectSummaryRow,
  mapProjectToSupabaseInsert,
  mapSupabaseDailyLogRow,
  mapSupabaseDailyLogWithRelationsRow,
  mapSupabaseClientRow,
  mapSupabaseProjectCostRow,
  mapSupabaseProjectCostWithRelationsRow,
  mapSupabaseMachineRow,
  mapSupabaseProjectRevenueRow,
  mapSupabaseProjectRevenueWithRelationsRow,
  mapSupabaseOperatorRow,
  mapSupabaseProjectRow,
  mapSupabaseProjectWithClientRow,
  type SupabaseClientRow,
  type SupabaseDailyLogRow,
  type SupabaseProjectCostRow,
  type SupabaseProjectRevenueRow,
  type SupabaseMachineRow,
  type SupabaseOperatorRow,
  type SupabaseProjectRow,
  type SupabaseProjectSummaryRow,
} from '../mappers'
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
  ProjectSummary,
  RevenueFilters,
} from '../../../shared/types'
import { formatLocalDate } from '../../../shared/date'

type SupabaseResult<T> = {
  data: T | null
  error: { message: string } | null
}

type SupabaseQuery<T> = {
  select(columns?: string): SupabaseQuery<T>
  or(filter: string): SupabaseQuery<T>
  eq(column: string, value: unknown): SupabaseQuery<T>
  gte(column: string, value: unknown): SupabaseQuery<T>
  lte(column: string, value: unknown): SupabaseQuery<T>
  insert(values: unknown): SupabaseQuery<T>
  update(values: unknown): SupabaseQuery<T>
  delete(): SupabaseQuery<T>
  then<TResult1 = SupabaseResult<T>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

type SupabaseClientLike = {
  from<T = unknown>(table: string): SupabaseQuery<T>
  rpc<T = unknown>(fn: string, params: Record<string, unknown>): Promise<SupabaseResult<T>>
}

function throwIfError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message)
  }
}

function firstItem<T>(data: T | T[] | null): T | null {
  if (!data) {
    return null
  }

  return Array.isArray(data) ? data[0] ?? null : data
}

function ensureList<T>(result: SupabaseResult<T[] | null>): T[] {
  throwIfError(result.error)
  return result.data ?? []
}

function ensureItem<T>(result: SupabaseResult<T | T[] | null>): T {
  throwIfError(result.error)
  const item = firstItem(result.data)
  if (!item) {
    throw new Error('Supabase returned no rows')
  }

  return item
}

function sumNumericValues<T extends Record<string, number | string | null>>(
  rows: T[],
  key: keyof T
): number {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0)
}

async function loadClientNameMap(client: SupabaseClientLike): Promise<Map<number, string>> {
  const result = await client.from<Pick<SupabaseClientRow, 'id' | 'name'>[]>('clients').select('id,name')
  const rows = ensureList(result as SupabaseResult<Pick<SupabaseClientRow, 'id' | 'name'>[] | null>)
  return new Map(rows.map((row) => [row.id, row.name]))
}

async function loadProjectRows(
  client: SupabaseClientLike,
  filters?: ProjectFilters
): Promise<SupabaseProjectRow[]> {
  let query = client.from<SupabaseProjectRow[]>('projects').select('*')

  if (filters?.search?.trim()) {
    query = query.or(`name.ilike.%${filters.search.trim()}%`)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId)
  }

  const result = await query
  return ensureList(result as SupabaseResult<SupabaseProjectRow[] | null>)
}

async function loadProjectById(client: SupabaseClientLike, id: number): Promise<SupabaseProjectRow | null> {
  const result = await client.from<SupabaseProjectRow[]>('projects').select('*').eq('id', id)
  return firstItem(result.data)
}

async function loadClientNameById(client: SupabaseClientLike, clientId: number): Promise<string | null> {
  const result = await client.from<Pick<SupabaseClientRow, 'id' | 'name'>[]>('clients').select('id,name').eq('id', clientId)
  return firstItem(result.data)?.name ?? null
}

async function loadProjectNameMap(client: SupabaseClientLike): Promise<Map<number, string>> {
  const result = await client.from<Pick<SupabaseProjectRow, 'id' | 'name'>[]>('projects').select('id,name')
  const rows = ensureList(result as SupabaseResult<Pick<SupabaseProjectRow, 'id' | 'name'>[] | null>)
  return new Map(rows.map((row) => [row.id, row.name]))
}

async function loadMachineNameMap(client: SupabaseClientLike): Promise<Map<number, string>> {
  const result = await client.from<Pick<SupabaseMachineRow, 'id' | 'name'>[]>('machines').select('id,name')
  const rows = ensureList(result as SupabaseResult<Pick<SupabaseMachineRow, 'id' | 'name'>[] | null>)
  return new Map(rows.map((row) => [row.id, row.name]))
}

async function loadOperatorNameMap(client: SupabaseClientLike): Promise<Map<number, string>> {
  const result = await client.from<Pick<SupabaseOperatorRow, 'id' | 'name'>[]>('operators').select('id,name')
  const rows = ensureList(result as SupabaseResult<Pick<SupabaseOperatorRow, 'id' | 'name'>[] | null>)
  return new Map(rows.map((row) => [row.id, row.name]))
}

function toDateOnly(value: Date | string | number): string {
  return formatLocalDate(value)
}

async function loadDailyLogRows(
  client: SupabaseClientLike,
  filters?: DailyLogFilters
): Promise<SupabaseDailyLogRow[]> {
  let query = client.from<SupabaseDailyLogRow[]>('daily_logs').select('*')

  if (filters?.projectId) query = query.eq('project_id', filters.projectId)
  if (filters?.machineId) query = query.eq('machine_id', filters.machineId)
  if (filters?.operatorId) query = query.eq('operator_id', filters.operatorId)
  if (filters?.dateFrom) query = query.gte('date', toDateOnly(filters.dateFrom))
  if (filters?.dateTo) query = query.lte('date', toDateOnly(filters.dateTo))

  const result = await query
  return ensureList(result as SupabaseResult<SupabaseDailyLogRow[] | null>)
}

async function loadDailyLogById(client: SupabaseClientLike, id: number): Promise<SupabaseDailyLogRow | null> {
  const result = await client.from<SupabaseDailyLogRow[]>('daily_logs').select('*').eq('id', id)
  return firstItem(result.data)
}

async function loadCostRows(client: SupabaseClientLike, filters?: CostFilters): Promise<SupabaseProjectCostRow[]> {
  let query = client.from<SupabaseProjectCostRow[]>('project_costs').select('*')

  if (filters?.projectId) query = query.eq('project_id', filters.projectId)
  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.dateFrom) query = query.gte('date', toDateOnly(filters.dateFrom))
  if (filters?.dateTo) query = query.lte('date', toDateOnly(filters.dateTo))

  const result = await query
  return ensureList(result as SupabaseResult<SupabaseProjectCostRow[] | null>)
}

async function loadCostById(client: SupabaseClientLike, id: number): Promise<SupabaseProjectCostRow | null> {
  const result = await client.from<SupabaseProjectCostRow[]>('project_costs').select('*').eq('id', id)
  return firstItem(result.data)
}

async function loadRevenueRows(
  client: SupabaseClientLike,
  filters?: RevenueFilters
): Promise<SupabaseProjectRevenueRow[]> {
  let query = client.from<SupabaseProjectRevenueRow[]>('project_revenues').select('*')

  if (filters?.projectId) query = query.eq('project_id', filters.projectId)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.dateFrom) query = query.gte('date', toDateOnly(filters.dateFrom))
  if (filters?.dateTo) query = query.lte('date', toDateOnly(filters.dateTo))

  const result = await query
  return ensureList(result as SupabaseResult<SupabaseProjectRevenueRow[] | null>)
}

async function loadRevenueById(
  client: SupabaseClientLike,
  id: number
): Promise<SupabaseProjectRevenueRow | null> {
  const result = await client.from<SupabaseProjectRevenueRow[]>('project_revenues').select('*').eq('id', id)
  return firstItem(result.data)
}

async function loadProjectSummaryFallback(client: SupabaseClientLike, id: number): Promise<ProjectSummary> {
  const [costsResult, revenuesResult, hoursResult] = await Promise.all([
    client.from<Array<{ amount: number | string | null }>>('project_costs').select('amount').eq('project_id', id),
    client.from<Array<{ amount: number | string | null }>>('project_revenues').select('amount').eq('project_id', id),
    client.from<Array<{ hours_worked: number | string | null }>>('daily_logs')
      .select('hours_worked')
      .eq('project_id', id),
  ])

  throwIfError(costsResult.error)
  throwIfError(revenuesResult.error)
  throwIfError(hoursResult.error)

  const costs = (costsResult.data ?? []) as Array<{ amount: number | string | null }>
  const revenues = (revenuesResult.data ?? []) as Array<{ amount: number | string | null }>
  const hours = (hoursResult.data ?? []) as Array<{ hours_worked: number | string | null }>

  const totalCosts = sumNumericValues(costs, 'amount')
  const totalRevenues = sumNumericValues(revenues, 'amount')
  const totalHours = sumNumericValues(hours, 'hours_worked')

  return {
    totalCosts,
    totalRevenues,
    profit: totalRevenues - totalCosts,
    totalHours,
  }
}

export async function createSupabaseRepository(): Promise<DomainRepository> {
  const client = (await createSupabaseClientFromEnv()) as unknown as SupabaseClientLike

  return {
    clients: {
      async list(filters?: { search?: string }) {
        let query = client.from<SupabaseClientRow[]>('clients').select('*')

        if (filters?.search?.trim()) {
          const search = filters.search.trim().replaceAll('"', '\\"')
          query = query.or(`name.ilike.%${search}%`)
        }

        const result = await query
        return ensureList(result as SupabaseResult<SupabaseClientRow[] | null>).map((row) =>
          mapSupabaseClientRow(row as never)
        )
      },
      async get(id: number) {
        const result = await client.from<SupabaseClientRow[]>('clients').select('*').eq('id', id)
        const row = firstItem(result.data)
        if (!row) {
          return null
        }

        return mapSupabaseClientRow(row as never)
      },
      async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client.from<SupabaseClientRow[]>('clients').insert(mapClientToSupabaseInsert(data)).select('*')
        return mapSupabaseClientRow(
          ensureItem(result as SupabaseResult<SupabaseClientRow[] | SupabaseClientRow | null>)
        )
      },
      async update(id: number, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<SupabaseClientRow[]>('clients')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
        return mapSupabaseClientRow(
          ensureItem(result as SupabaseResult<SupabaseClientRow[] | SupabaseClientRow | null>)
        )
      },
      async delete(id: number) {
        const result = await client.from('clients').delete().eq('id', id)
        throwIfError(result.error)
      },
    },
    projects: {
      async list(filters?: ProjectFilters) {
        const [rows, clientNames] = await Promise.all([loadProjectRows(client, filters), loadClientNameMap(client)])
        return rows.map((row) => mapSupabaseProjectWithClientRow(row, clientNames.get(row.client_id) ?? null))
      },
      async get(id: number) {
        const row = await loadProjectById(client, id)
        if (!row) {
          return null
        }

        const clientName = await loadClientNameById(client, row.client_id)
        return mapSupabaseProjectWithClientRow(row, clientName)
      },
      async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client.from<SupabaseProjectRow[]>('projects').insert(mapProjectToSupabaseInsert(data)).select('*')
        return mapSupabaseProjectRow(
          ensureItem(result as SupabaseResult<SupabaseProjectRow[] | SupabaseProjectRow | null>)
        )
      },
      async update(id: number, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<SupabaseProjectRow[]>('projects')
          .update({
            ...data,
            start_date: data.startDate ? formatLocalDate(data.startDate) : data.startDate,
            end_date: data.endDate ? formatLocalDate(data.endDate) : data.endDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*')

        return mapSupabaseProjectRow(
          ensureItem(result as SupabaseResult<SupabaseProjectRow[] | SupabaseProjectRow | null>)
        )
      },
      async delete(id: number) {
        const result = await client.from('projects').delete().eq('id', id)
        throwIfError(result.error)
      },
      async summary(id: number) {
        try {
          const result = await client.rpc<SupabaseProjectSummaryRow[] | SupabaseProjectSummaryRow>(
            'project_summary',
            { project_id: id }
          )

          return mapProjectSummaryRow(
            ensureItem(result as SupabaseResult<SupabaseProjectSummaryRow[] | SupabaseProjectSummaryRow | null>)
          )
        } catch {
          return loadProjectSummaryFallback(client, id)
        }
      },
    },
    machines: {
      async list(filters?: { search?: string; status?: Machine['status'] }) {
        let query = client.from<SupabaseMachineRow[]>('machines').select('*')

        if (filters?.search?.trim()) {
          const search = filters.search.trim().replaceAll('"', '\\"')
          query = query.or(`name.ilike.%${search}%,type.ilike.%${search}%`)
        }

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        const result = await query
        return ensureList(result as SupabaseResult<SupabaseMachineRow[] | null>).map((row) =>
          mapSupabaseMachineRow(row as never)
        )
      },
      async get(id: number) {
        const result = await client.from<SupabaseMachineRow[]>('machines').select('*').eq('id', id)
        const row = firstItem(result.data)
        if (!row) {
          return null
        }

        return mapSupabaseMachineRow(row as never)
      },
      async create(data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client.from<SupabaseMachineRow[]>('machines').insert(mapMachineToSupabaseInsert(data)).select('*')
        return mapSupabaseMachineRow(
          ensureItem(result as SupabaseResult<SupabaseMachineRow[] | SupabaseMachineRow | null>)
        )
      },
      async update(id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<SupabaseMachineRow[]>('machines')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
        return mapSupabaseMachineRow(
          ensureItem(result as SupabaseResult<SupabaseMachineRow[] | SupabaseMachineRow | null>)
        )
      },
      async delete(id: number) {
        const result = await client.from('machines').delete().eq('id', id)
        throwIfError(result.error)
      },
    },
    operators: {
      async list(filters?: { search?: string; isActive?: boolean }) {
        let query = client.from<SupabaseOperatorRow[]>('operators').select('*')

        if (filters?.search?.trim()) {
          const search = filters.search.trim().replaceAll('"', '\\"')
          query = query.or(`name.ilike.%${search}%`)
        }

        if (filters?.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive)
        }

        const result = await query
        return ensureList(result as SupabaseResult<SupabaseOperatorRow[] | null>).map((row) =>
          mapSupabaseOperatorRow(row as never)
        )
      },
      async get(id: number) {
        const result = await client.from<SupabaseOperatorRow[]>('operators').select('*').eq('id', id)
        const row = firstItem(result.data)
        if (!row) {
          return null
        }

        return mapSupabaseOperatorRow(row as never)
      },
      async create(data: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client.from<SupabaseOperatorRow[]>('operators').insert(mapOperatorToSupabaseInsert(data)).select('*')
        return mapSupabaseOperatorRow(
          ensureItem(result as SupabaseResult<SupabaseOperatorRow[] | SupabaseOperatorRow | null>)
        )
      },
      async update(id: number, data: Partial<Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<SupabaseOperatorRow[]>('operators')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
        return mapSupabaseOperatorRow(
          ensureItem(result as SupabaseResult<SupabaseOperatorRow[] | SupabaseOperatorRow | null>)
        )
      },
      async delete(id: number) {
        const result = await client.from('operators').delete().eq('id', id)
        throwIfError(result.error)
      },
    },
    dailylogs: {
      async list(filters?: DailyLogFilters) {
        const [rows, projectNames, machineNames, operatorNames] = await Promise.all([
          loadDailyLogRows(client, filters),
          loadProjectNameMap(client),
          loadMachineNameMap(client),
          loadOperatorNameMap(client),
        ])

        return rows.map((row) =>
          mapSupabaseDailyLogWithRelationsRow(row, {
            projectName: projectNames.get(row.project_id) ?? null,
            machineName: row.machine_id ? machineNames.get(row.machine_id) ?? null : null,
            operatorName: row.operator_id ? operatorNames.get(row.operator_id) ?? null : null,
          })
        )
      },
      async get(id: number) {
        const row = await loadDailyLogById(client, id)
        if (!row) {
          return null
        }

        const [projectNames, machineNames, operatorNames] = await Promise.all([
          loadProjectNameMap(client),
          loadMachineNameMap(client),
          loadOperatorNameMap(client),
        ])

        return mapSupabaseDailyLogWithRelationsRow(row, {
          projectName: projectNames.get(row.project_id) ?? null,
          machineName: row.machine_id ? machineNames.get(row.machine_id) ?? null : null,
          operatorName: row.operator_id ? operatorNames.get(row.operator_id) ?? null : null,
        })
      },
      async create(data: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client
          .from<SupabaseDailyLogRow[]>('daily_logs')
          .insert(mapDailyLogToSupabaseInsert(data))
          .select('*')

        return mapSupabaseDailyLogRow(
          ensureItem(result as SupabaseResult<SupabaseDailyLogRow[] | SupabaseDailyLogRow | null>)
        )
      },
      async update(id: number, data: Partial<Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<SupabaseDailyLogRow[]>('daily_logs')
          .update({
            ...data,
            date: data.date ? formatLocalDate(data.date) : data.date,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*')

        return mapSupabaseDailyLogRow(
          ensureItem(result as SupabaseResult<SupabaseDailyLogRow[] | SupabaseDailyLogRow | null>)
        )
      },
      async delete(id: number) {
        const result = await client.from('daily_logs').delete().eq('id', id)
        throwIfError(result.error)
      },
    },
    costs: {
      async list(filters?: CostFilters) {
        const [rows, projectNames, machineNames, operatorNames] = await Promise.all([
          loadCostRows(client, filters),
          loadProjectNameMap(client),
          loadMachineNameMap(client),
          loadOperatorNameMap(client),
        ])

        return rows.map((row) =>
          mapSupabaseProjectCostWithRelationsRow(row, {
            projectName: projectNames.get(row.project_id) ?? null,
            machineName: row.machine_id ? machineNames.get(row.machine_id) ?? null : null,
            operatorName: row.operator_id ? operatorNames.get(row.operator_id) ?? null : null,
          })
        )
      },
      async get(id: number) {
        const row = await loadCostById(client, id)
        if (!row) {
          return null
        }

        const [projectNames, machineNames, operatorNames] = await Promise.all([
          loadProjectNameMap(client),
          loadMachineNameMap(client),
          loadOperatorNameMap(client),
        ])

        return mapSupabaseProjectCostWithRelationsRow(row, {
          projectName: projectNames.get(row.project_id) ?? null,
          machineName: row.machine_id ? machineNames.get(row.machine_id) ?? null : null,
          operatorName: row.operator_id ? operatorNames.get(row.operator_id) ?? null : null,
        })
      },
      async create(data: Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client
          .from<SupabaseProjectCostRow[]>('project_costs')
          .insert(mapProjectCostToSupabaseInsert(data))
          .select('*')

        return mapSupabaseProjectCostRow(
          ensureItem(result as SupabaseResult<SupabaseProjectCostRow[] | SupabaseProjectCostRow | null>)
        )
      },
      async update(id: number, data: Partial<Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<SupabaseProjectCostRow[]>('project_costs')
          .update({
            ...data,
            date: data.date ? formatLocalDate(data.date) : data.date,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*')

        return mapSupabaseProjectCostRow(
          ensureItem(result as SupabaseResult<SupabaseProjectCostRow[] | SupabaseProjectCostRow | null>)
        )
      },
      async delete(id: number) {
        const result = await client.from('project_costs').delete().eq('id', id)
        throwIfError(result.error)
      },
    },
    revenues: {
      async list(filters?: RevenueFilters) {
        const [rows, projectNames] = await Promise.all([loadRevenueRows(client, filters), loadProjectNameMap(client)])

        return rows.map((row) =>
          mapSupabaseProjectRevenueWithRelationsRow(row, projectNames.get(row.project_id) ?? null)
        )
      },
      async get(id: number) {
        const row = await loadRevenueById(client, id)
        if (!row) {
          return null
        }

        const projectNames = await loadProjectNameMap(client)
        return mapSupabaseProjectRevenueWithRelationsRow(row, projectNames.get(row.project_id) ?? null)
      },
      async create(data: Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client
          .from<SupabaseProjectRevenueRow[]>('project_revenues')
          .insert(mapProjectRevenueToSupabaseInsert(data))
          .select('*')

        return mapSupabaseProjectRevenueRow(
          ensureItem(result as SupabaseResult<SupabaseProjectRevenueRow[] | SupabaseProjectRevenueRow | null>)
        )
      },
      async update(id: number, data: Partial<Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<SupabaseProjectRevenueRow[]>('project_revenues')
          .update({
            ...data,
            date: data.date ? formatLocalDate(data.date) : data.date,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*')

        return mapSupabaseProjectRevenueRow(
          ensureItem(result as SupabaseResult<SupabaseProjectRevenueRow[] | SupabaseProjectRevenueRow | null>)
        )
      },
      async delete(id: number) {
        const result = await client.from('project_revenues').delete().eq('id', id)
        throwIfError(result.error)
      },
    },
  }
}

export { mapClientToSupabaseInsert, mapSupabaseClientRow }
