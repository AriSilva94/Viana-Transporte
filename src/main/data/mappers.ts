import type { Client, Machine, Operator } from '../../shared/types'

export interface SupabaseClientRow {
  id: number
  name: string
  document: string | null
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseMachineRow {
  id: number
  name: string
  type: string
  identifier: string | null
  brand_model: string | null
  status: Machine['status']
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseOperatorRow {
  id: number
  name: string
  phone: string | null
  role: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export function mapSupabaseClientRow(row: SupabaseClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    document: row.document,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapClientToSupabaseInsert(
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
): Omit<SupabaseClientRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: client.name,
    document: client.document,
    phone: client.phone,
    email: client.email,
    notes: client.notes,
  }
}

export function mapSupabaseMachineRow(row: SupabaseMachineRow): Machine {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    identifier: row.identifier,
    brandModel: row.brand_model,
    status: row.status,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapMachineToSupabaseInsert(
  machine: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>
): Omit<SupabaseMachineRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: machine.name,
    type: machine.type,
    identifier: machine.identifier,
    brand_model: machine.brandModel,
    status: machine.status,
    notes: machine.notes,
  }
}

export function mapSupabaseOperatorRow(row: SupabaseOperatorRow): Operator {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    isActive: row.is_active,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapOperatorToSupabaseInsert(
  operator: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>
): Omit<SupabaseOperatorRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: operator.name,
    phone: operator.phone,
    role: operator.role,
    is_active: operator.isActive,
    notes: operator.notes,
  }
}
