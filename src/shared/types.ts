// ─── Entity Types ────────────────────────────────────────────────────────────

export interface Client {
  id: number
  name: string
  document: string | null
  phone: string | null
  email: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: number
  clientId: number
  name: string
  location: string | null
  startDate: Date | null
  endDate: Date | null
  status: 'planned' | 'active' | 'completed' | 'canceled'
  contractAmount: number | null
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectWithClient extends Project {
  clientName: string | null
}

export interface Machine {
  id: number
  name: string
  type: string
  identifier: string | null
  brandModel: string | null
  status: 'available' | 'allocated' | 'under_maintenance' | 'inactive'
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Operator {
  id: number
  name: string
  phone: string | null
  role: string | null
  isActive: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DailyLog {
  id: number
  date: Date
  projectId: number
  machineId: number | null
  operatorId: number | null
  hoursWorked: number
  workDescription: string | null
  fuelQuantity: number | null
  downtimeNotes: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectCost {
  id: number
  date: Date
  projectId: number
  machineId: number | null
  operatorId: number | null
  category: 'fuel' | 'labor' | 'maintenance' | 'transport' | 'outsourced' | 'miscellaneous'
  description: string
  amount: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectRevenue {
  id: number
  date: Date
  projectId: number
  description: string
  amount: number
  status: 'planned' | 'billed' | 'received'
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Computed Result Types ────────────────────────────────────────────────────

export interface ProjectSummary {
  totalCosts: number
  totalRevenues: number
  profit: number
  totalHours: number
}

export interface DashboardStats {
  activeProjects: number
  completedProjects: number
  totalMachines: number
  allocatedMachines: number
  totalCosts: number
  totalRevenues: number
  estimatedProfit: number
  recentLogs: DailyLog[]
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface ProjectFilters {
  status?: Project['status']
  clientId?: number
  search?: string
}

export interface DailyLogFilters {
  projectId?: number
  machineId?: number
  operatorId?: number
  dateFrom?: Date
  dateTo?: Date
}

export interface CostFilters {
  projectId?: number
  category?: ProjectCost['category']
  dateFrom?: Date
  dateTo?: Date
}

export interface RevenueFilters {
  projectId?: number
  status?: ProjectRevenue['status']
  dateFrom?: Date
  dateTo?: Date
}

// ─── ElectronAPI ──────────────────────────────────────────────────────────────

export interface ElectronAPI {
  clients: {
    list: (filters?: { search?: string }) => Promise<Client[]>
    get: (id: number) => Promise<Client | null>
    create: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>
    update: (id: number, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Client>
    delete: (id: number) => Promise<void>
  }
  projects: {
    list: (filters?: ProjectFilters) => Promise<ProjectWithClient[]>
    get: (id: number) => Promise<ProjectWithClient | null>
    create: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
    update: (id: number, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Project>
    delete: (id: number) => Promise<void>
    summary: (id: number) => Promise<ProjectSummary>
  }
  machines: {
    list: (filters?: { search?: string; status?: Machine['status'] }) => Promise<Machine[]>
    get: (id: number) => Promise<Machine | null>
    create: (data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Machine>
    update: (id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Machine>
    delete: (id: number) => Promise<void>
  }
  operators: {
    list: (filters?: { search?: string; isActive?: boolean }) => Promise<Operator[]>
    get: (id: number) => Promise<Operator | null>
    create: (data: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Operator>
    update: (id: number, data: Partial<Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Operator>
    delete: (id: number) => Promise<void>
  }
  dailylogs: {
    list: (filters?: DailyLogFilters) => Promise<DailyLog[]>
    get: (id: number) => Promise<DailyLog | null>
    create: (data: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DailyLog>
    update: (id: number, data: Partial<Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<DailyLog>
    delete: (id: number) => Promise<void>
  }
  costs: {
    list: (filters?: CostFilters) => Promise<ProjectCost[]>
    get: (id: number) => Promise<ProjectCost | null>
    create: (data: Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectCost>
    update: (id: number, data: Partial<Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<ProjectCost>
    delete: (id: number) => Promise<void>
  }
  revenues: {
    list: (filters?: RevenueFilters) => Promise<ProjectRevenue[]>
    get: (id: number) => Promise<ProjectRevenue | null>
    create: (data: Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectRevenue>
    update: (id: number, data: Partial<Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<ProjectRevenue>
    delete: (id: number) => Promise<void>
  }
  dashboard: {
    stats: () => Promise<DashboardStats>
  }
}
