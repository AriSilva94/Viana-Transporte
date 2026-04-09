import type {
  Client,
  CostFilters,
  DailyLog,
  DailyLogFilters,
  Machine,
  Operator,
  ProjectCost,
  Project,
  ProjectFilters,
  ProjectSummary,
  ProjectCostWithRelations,
  ProjectRevenue,
  ProjectRevenueWithRelations,
  RevenueFilters,
  DailyLogWithRelations,
  ProjectWithClient,
} from '../../shared/types'

export type DataProvider = 'supabase'

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

export interface ProjectRepository {
  list(filters?: ProjectFilters): Promise<ProjectWithClient[]>
  get(id: number): Promise<ProjectWithClient | null>
  create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>
  update(id: number, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project>
  delete(id: number): Promise<void>
  summary(id: number): Promise<ProjectSummary>
}

export interface DailyLogRepository {
  list(filters?: DailyLogFilters): Promise<DailyLogWithRelations[]>
  get(id: number): Promise<DailyLogWithRelations | null>
  create(data: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyLog>
  update(id: number, data: Partial<Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DailyLog>
  delete(id: number): Promise<void>
}

export interface CostRepository {
  list(filters?: CostFilters): Promise<ProjectCostWithRelations[]>
  get(id: number): Promise<ProjectCostWithRelations | null>
  create(data: Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectCost>
  update(id: number, data: Partial<Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ProjectCost>
  delete(id: number): Promise<void>
}

export interface RevenueRepository {
  list(filters?: RevenueFilters): Promise<ProjectRevenueWithRelations[]>
  get(id: number): Promise<ProjectRevenueWithRelations | null>
  create(data: Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectRevenue>
  update(id: number, data: Partial<Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ProjectRevenue>
  delete(id: number): Promise<void>
}

export interface DomainRepository {
  clients: ClientRepository
  projects: ProjectRepository
  machines: MachineRepository
  operators: OperatorRepository
  dailylogs: DailyLogRepository
  costs: CostRepository
  revenues: RevenueRepository
}
