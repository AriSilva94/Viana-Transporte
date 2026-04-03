import type { Client } from '../../shared/types'

export type DataProvider = 'sqlite' | 'supabase'

export interface ClientRepository {
  list(filters?: { search?: string }): Promise<Client[]>
  get(id: number): Promise<Client | null>
  create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client>
  update(id: number, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client>
  delete(id: number): Promise<void>
}

export interface DomainRepository {
  clients: ClientRepository
}
