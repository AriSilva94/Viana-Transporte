import type { Client } from '../../shared/types'

export type DataProvider = 'sqlite' | 'supabase'

export interface ClientRepository {
  list(filters?: { search?: string }): Promise<Client[]>
}

export interface DomainRepository {
  clients: ClientRepository
}
