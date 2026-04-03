import type { DomainRepository } from '../types'
import { createSupabaseClientFromEnv } from './client'
import {
  mapClientToSupabaseInsert,
  mapMachineToSupabaseInsert,
  mapOperatorToSupabaseInsert,
  mapProjectSummaryRow,
  mapProjectToSupabaseInsert,
  mapSupabaseClientRow,
  mapSupabaseMachineRow,
  mapSupabaseOperatorRow,
  mapSupabaseProjectRow,
  mapSupabaseProjectWithClientRow,
  type SupabaseClientRow,
  type SupabaseMachineRow,
  type SupabaseOperatorRow,
  type SupabaseProjectRow,
  type SupabaseProjectSummaryRow,
} from '../mappers'
import type { Client, Machine, Operator, Project, ProjectFilters } from '../../../shared/types'

type SupabaseResult<T> = {
  data: T | null
  error: { message: string } | null
}

type SupabaseQuery<T> = {
  select(columns?: string): SupabaseQuery<T>
  or(filter: string): SupabaseQuery<T>
  eq(column: string, value: unknown): SupabaseQuery<T>
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
        const rows = await loadProjectRows(client)
        const row = rows.find((item) => item.id === id)
        if (!row) {
          return null
        }

        const clientNames = await loadClientNameMap(client)
        return mapSupabaseProjectWithClientRow(row, clientNames.get(row.client_id) ?? null)
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
            start_date: data.startDate ? data.startDate.toISOString() : data.startDate,
            end_date: data.endDate ? data.endDate.toISOString() : data.endDate,
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
        const result = await client.rpc<SupabaseProjectSummaryRow[] | SupabaseProjectSummaryRow>(
          'project_summary',
          { project_id: id }
        )

        return mapProjectSummaryRow(ensureItem(result as SupabaseResult<SupabaseProjectSummaryRow[] | SupabaseProjectSummaryRow | null>))
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
  }
}

export { mapClientToSupabaseInsert, mapSupabaseClientRow }
