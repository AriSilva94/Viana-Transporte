import type { Client, Machine, Operator } from '../../shared/types'

export type DataProvider = 'sqlite' | 'supabase'

export interface ClientRepository {
  list(filters?: { search?: string }): Promise<Client[]>
  get(id: number): Promise<Client | null>
  create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client>
  update(id: number, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client>
  delete(id: number): Promise<void>
}

export interface MachineRepository {
  list(filters?: { search?: string; status?: Machine['status'] }): Promise<Machine[]>
  get(id: number): Promise<Machine | null>
  create(data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Machine>
  update(id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Machine>
  delete(id: number): Promise<void>
}

export interface OperatorRepository {
  list(filters?: { search?: string; isActive?: boolean }): Promise<Operator[]>
  get(id: number): Promise<Operator | null>
  create(data: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>): Promise<Operator>
  update(id: number, data: Partial<Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Operator>
  delete(id: number): Promise<void>
}

export interface DomainRepository {
  clients: ClientRepository
  machines: MachineRepository
  operators: OperatorRepository
}
