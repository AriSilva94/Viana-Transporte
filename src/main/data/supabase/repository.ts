import type { DomainRepository } from '../types'
import { createSupabaseClientFromEnv } from './client'
import { createSupabaseRepositoryNotImplementedError } from './errors'
import {
  mapClientToSupabaseInsert,
  mapMachineToSupabaseInsert,
  mapOperatorToSupabaseInsert,
  mapSupabaseClientRow,
  mapSupabaseMachineRow,
  mapSupabaseOperatorRow,
} from '../mappers'
import type { Client, Machine, Operator } from '../../../shared/types'

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
}

function notImplemented(operation: string): never {
  throw createSupabaseRepositoryNotImplementedError(operation)
}

function throwIfError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message)
  }
}

function ensureList<T>(result: SupabaseResult<T[] | null>): T[] {
  throwIfError(result.error)
  return result.data ?? []
}

function firstItem<T>(data: T | T[] | null): T | null {
  if (!data) {
    return null
  }

  return Array.isArray(data) ? data[0] ?? null : data
}

function ensureItem<T>(result: SupabaseResult<T | T[] | null>): T {
  throwIfError(result.error)
  const item = firstItem(result.data)
  if (!item) {
    throw new Error('Supabase returned no rows')
  }

  return item
}

export async function createSupabaseRepository(): Promise<DomainRepository> {
  const client = (await createSupabaseClientFromEnv()) as unknown as SupabaseClientLike

  return {
    clients: {
      async list(filters?: { search?: string }) {
        let query = client.from<Client[]>('clients').select('*')

        if (filters?.search?.trim()) {
          const search = filters.search.trim().replaceAll('"', '\\"')
          query = query.or(`name.ilike.%${search}%`)
        }

        const result = await query
        return ensureList(result as SupabaseResult<Client[] | null>).map((row) =>
          mapSupabaseClientRow(row as never)
        )
      },
      async get(id: number) {
        const result = await client.from<Client>('clients').select('*').eq('id', id)
        const row = firstItem(result.data)
        if (!row) {
          return null
        }

        return mapSupabaseClientRow(row as never)
      },
      async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client
          .from<Client>('clients')
          .insert(mapClientToSupabaseInsert(data))
          .select('*')

        return mapSupabaseClientRow(ensureItem(result as SupabaseResult<Client[] | Client | null>))
      },
      async update(id: number, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<Client>('clients')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')

        return mapSupabaseClientRow(ensureItem(result as SupabaseResult<Client[] | Client | null>))
      },
      async delete(id: number) {
        const result = await client.from('clients').delete().eq('id', id)
        throwIfError(result.error)
      },
    },
    machines: {
      async list(filters?: { search?: string; status?: Machine['status'] }) {
        let query = client.from<Machine[]>('machines').select('*')

        if (filters?.search?.trim()) {
          const search = filters.search.trim().replaceAll('"', '\\"')
          query = query.or(`name.ilike.%${search}%,type.ilike.%${search}%`)
        }

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        const result = await query
        return ensureList(result as SupabaseResult<Machine[] | null>).map((row) =>
          mapSupabaseMachineRow(row as never)
        )
      },
      async get(id: number) {
        const result = await client.from<Machine>('machines').select('*').eq('id', id)
        const row = firstItem(result.data)
        if (!row) {
          return null
        }

        return mapSupabaseMachineRow(row as never)
      },
      async create(data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client
          .from<Machine>('machines')
          .insert(mapMachineToSupabaseInsert(data))
          .select('*')

        return mapSupabaseMachineRow(ensureItem(result as SupabaseResult<Machine[] | Machine | null>))
      },
      async update(id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<Machine>('machines')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')

        return mapSupabaseMachineRow(ensureItem(result as SupabaseResult<Machine[] | Machine | null>))
      },
      async delete(id: number) {
        const result = await client.from('machines').delete().eq('id', id)
        throwIfError(result.error)
      },
    },
    operators: {
      async list(filters?: { search?: string; isActive?: boolean }) {
        let query = client.from<Operator[]>('operators').select('*')

        if (filters?.search?.trim()) {
          const search = filters.search.trim().replaceAll('"', '\\"')
          query = query.or(`name.ilike.%${search}%`)
        }

        if (filters?.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive)
        }

        const result = await query
        return ensureList(result as SupabaseResult<Operator[] | null>).map((row) =>
          mapSupabaseOperatorRow(row as never)
        )
      },
      async get(id: number) {
        const result = await client.from<Operator>('operators').select('*').eq('id', id)
        const row = firstItem(result.data)
        if (!row) {
          return null
        }

        return mapSupabaseOperatorRow(row as never)
      },
      async create(data: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>) {
        const result = await client
          .from<Operator>('operators')
          .insert(mapOperatorToSupabaseInsert(data))
          .select('*')

        return mapSupabaseOperatorRow(ensureItem(result as SupabaseResult<Operator[] | Operator | null>))
      },
      async update(id: number, data: Partial<Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>>) {
        const result = await client
          .from<Operator>('operators')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')

        return mapSupabaseOperatorRow(ensureItem(result as SupabaseResult<Operator[] | Operator | null>))
      },
      async delete(id: number) {
        const result = await client.from('operators').delete().eq('id', id)
        throwIfError(result.error)
      },
    },
  }
}

export { mapClientToSupabaseInsert, mapSupabaseClientRow }
