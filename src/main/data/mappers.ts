import type { Client, Machine, Operator, Project, ProjectSummary, ProjectWithClient } from '../../shared/types'

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

export interface SupabaseProjectRow {
  id: number
  client_id: number
  name: string
  location: string | null
  start_date: string | null
  end_date: string | null
  status: Project['status']
  contract_amount: number | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseProjectSummaryRow {
  total_costs: number | string | null
  total_revenues: number | string | null
  profit: number | string | null
  total_hours: number | string | null
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

export function mapSupabaseProjectRow(row: SupabaseProjectRow): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    location: row.location,
    startDate: row.start_date ? new Date(row.start_date) : null,
    endDate: row.end_date ? new Date(row.end_date) : null,
    status: row.status,
    contractAmount: row.contract_amount,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapSupabaseProjectWithClientRow(
  row: SupabaseProjectRow,
  clientName: string | null
): ProjectWithClient {
  return {
    ...mapSupabaseProjectRow(row),
    clientName,
  }
}

export function mapProjectToSupabaseInsert(
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Omit<SupabaseProjectRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    client_id: project.clientId,
    name: project.name,
    location: project.location,
    start_date: project.startDate ? project.startDate.toISOString() : null,
    end_date: project.endDate ? project.endDate.toISOString() : null,
    status: project.status,
    contract_amount: project.contractAmount,
    description: project.description,
  }
}

export function mapProjectSummaryRow(row: SupabaseProjectSummaryRow): ProjectSummary {
  return {
    totalCosts: Number(row.total_costs ?? 0),
    totalRevenues: Number(row.total_revenues ?? 0),
    profit: Number(row.profit ?? 0),
    totalHours: Number(row.total_hours ?? 0),
  }
}
