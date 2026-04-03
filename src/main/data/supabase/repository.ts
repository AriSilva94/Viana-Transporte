import type { DomainRepository } from '../types'
import { createSupabaseClientFromEnv } from './client'
import { createSupabaseRepositoryNotImplementedError } from './errors'
import { mapClientToSupabaseInsert, mapSupabaseClientRow } from '../mappers'

function notImplemented(operation: string): never {
  throw createSupabaseRepositoryNotImplementedError(operation)
}

export async function createSupabaseRepository(): Promise<DomainRepository> {
  await createSupabaseClientFromEnv()

  return {
    clients: {
      async list() {
        return notImplemented('clients.list')
      },
      async get() {
        return notImplemented('clients.get')
      },
      async create(data) {
        mapClientToSupabaseInsert(data)
        return notImplemented('clients.create')
      },
      async update(id, data) {
        void id
        void data
        return notImplemented('clients.update')
      },
      async delete(id) {
        void id
        return notImplemented('clients.delete')
      },
    },
    machines: {
      async list() {
        return notImplemented('machines.list')
      },
      async get() {
        return notImplemented('machines.get')
      },
      async create(data) {
        void data
        return notImplemented('machines.create')
      },
      async update(id, data) {
        void id
        void data
        return notImplemented('machines.update')
      },
      async delete(id) {
        void id
        return notImplemented('machines.delete')
      },
    },
    operators: {
      async list() {
        return notImplemented('operators.list')
      },
      async get() {
        return notImplemented('operators.get')
      },
      async create(data) {
        void data
        return notImplemented('operators.create')
      },
      async update(id, data) {
        void id
        void data
        return notImplemented('operators.update')
      },
      async delete(id) {
        void id
        return notImplemented('operators.delete')
      },
    },
  }
}

export { mapClientToSupabaseInsert, mapSupabaseClientRow }
