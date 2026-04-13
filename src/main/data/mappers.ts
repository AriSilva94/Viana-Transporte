import type {
  Client,
  DailyLog,
  DailyLogWithRelations,
  Machine,
  Operator,
  Project,
  ProjectCost,
  ProjectCostWithRelations,
  ProjectRevenue,
  ProjectRevenueWithRelations,
  ProjectSummary,
  ProjectWithClient,
} from '../../shared/types'
import { formatLocalDate, parseLocalDate } from '../../shared/date'

export interface SupabaseClientRow {
  id: number
  user_id: string
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
  user_id: string
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
  user_id: string
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
  user_id: string
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

export interface SupabaseDailyLogRow {
  id: number
  user_id: string
  date: string
  project_id: number
  machine_id: number | null
  operator_id: number | null
  hours_worked: number | string
  work_description: string | null
  fuel_quantity: number | string | null
  downtime_notes: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseDailyLogWithRelationsRow extends SupabaseDailyLogRow {
  projectName: string | null
  machineName: string | null
  operatorName: string | null
}

export interface SupabaseProjectCostRow {
  id: number
  user_id: string
  date: string
  project_id: number
  machine_id: number | null
  operator_id: number | null
  category: ProjectCost['category']
  description: string
  amount: number | string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseProjectCostWithRelationsRow extends SupabaseProjectCostRow {
  projectName: string | null
  machineName: string | null
  operatorName: string | null
}

export interface SupabaseProjectRevenueRow {
  id: number
  user_id: string
  date: string
  project_id: number
  description: string
  amount: number | string
  status: ProjectRevenue['status']
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseProjectRevenueWithRelationsRow extends SupabaseProjectRevenueRow {
  projectName: string | null
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
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Omit<SupabaseClientRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
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
  machine: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Omit<SupabaseMachineRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
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
  operator: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Omit<SupabaseOperatorRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
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
    startDate: row.start_date ? parseLocalDate(row.start_date) : null,
    endDate: row.end_date ? parseLocalDate(row.end_date) : null,
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
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Omit<SupabaseProjectRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    client_id: project.clientId,
    name: project.name,
    location: project.location,
    start_date: project.startDate ? formatLocalDate(project.startDate) : null,
    end_date: project.endDate ? formatLocalDate(project.endDate) : null,
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

export function mapSupabaseDailyLogRow(row: SupabaseDailyLogRow): DailyLog {
  return {
    id: row.id,
    date: parseLocalDate(row.date),
    projectId: row.project_id,
    machineId: row.machine_id,
    operatorId: row.operator_id,
    hoursWorked: Number(row.hours_worked),
    workDescription: row.work_description,
    fuelQuantity: row.fuel_quantity === null ? null : Number(row.fuel_quantity),
    downtimeNotes: row.downtime_notes,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapSupabaseDailyLogWithRelationsRow(
  row: SupabaseDailyLogRow,
  relations: { projectName: string | null; machineName: string | null; operatorName: string | null }
): DailyLogWithRelations {
  return {
    ...mapSupabaseDailyLogRow(row),
    ...relations,
  }
}

export function mapDailyLogToSupabaseInsert(
  log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Omit<SupabaseDailyLogRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    date: formatLocalDate(log.date),
    project_id: log.projectId,
    machine_id: log.machineId,
    operator_id: log.operatorId,
    hours_worked: log.hoursWorked,
    work_description: log.workDescription,
    fuel_quantity: log.fuelQuantity,
    downtime_notes: log.downtimeNotes,
    notes: log.notes,
  }
}

export function mapSupabaseProjectCostRow(row: SupabaseProjectCostRow): ProjectCost {
  return {
    id: row.id,
    date: parseLocalDate(row.date),
    projectId: row.project_id,
    machineId: row.machine_id,
    operatorId: row.operator_id,
    category: row.category,
    description: row.description,
    amount: Number(row.amount),
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapSupabaseProjectCostWithRelationsRow(
  row: SupabaseProjectCostRow,
  relations: { projectName: string | null; machineName: string | null; operatorName: string | null }
): ProjectCostWithRelations {
  return {
    ...mapSupabaseProjectCostRow(row),
    ...relations,
  }
}

export function mapProjectCostToSupabaseInsert(
  cost: Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Omit<SupabaseProjectCostRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    date: formatLocalDate(cost.date),
    project_id: cost.projectId,
    machine_id: cost.machineId,
    operator_id: cost.operatorId,
    category: cost.category,
    description: cost.description,
    amount: cost.amount,
    notes: cost.notes,
  }
}

export function mapSupabaseProjectRevenueRow(row: SupabaseProjectRevenueRow): ProjectRevenue {
  return {
    id: row.id,
    date: parseLocalDate(row.date),
    projectId: row.project_id,
    description: row.description,
    amount: Number(row.amount),
    status: row.status,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapSupabaseProjectRevenueWithRelationsRow(
  row: SupabaseProjectRevenueRow,
  projectName: string | null
): ProjectRevenueWithRelations {
  return {
    ...mapSupabaseProjectRevenueRow(row),
    projectName,
  }
}

export function mapProjectRevenueToSupabaseInsert(
  revenue: Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Omit<SupabaseProjectRevenueRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    date: formatLocalDate(revenue.date),
    project_id: revenue.projectId,
    description: revenue.description,
    amount: revenue.amount,
    status: revenue.status,
    notes: revenue.notes,
  }
}
