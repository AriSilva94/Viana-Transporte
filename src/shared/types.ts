import type { LicenseStatus } from './license'

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

export interface DailyLogWithRelations extends DailyLog {
  projectName: string | null
  machineName: string | null
  operatorName: string | null
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

export interface ProjectCostWithRelations extends ProjectCost {
  projectName: string | null
  machineName: string | null
  operatorName: string | null
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

export interface ProjectRevenueWithRelations extends ProjectRevenue {
  projectName: string | null
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

export type SupportedLocale = 'pt-BR' | 'en' | 'es'

export interface AppPreferences {
  language: SupportedLocale | null
}

export type AuthRole = 'admin' | 'owner' | 'employee'

export interface AuthProfile {
  id: string
  email: string
  role: AuthRole
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  userId: string
  email: string | null
  expiresAt: number | null
}

export interface AuthState {
  session: AuthSession | null
  profile: AuthProfile | null
  pendingPasswordReset: boolean
}

export interface AuthSignUpResult {
  emailConfirmationSent: true
}

export interface AuthPasswordResetResult {
  emailSent: true
}

export interface UserProfileListItem {
  id: string
  email: string
  role: AuthRole
  createdAt: string
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
  dateFrom?: string
  dateTo?: string
}

export interface CostFilters {
  projectId?: number
  category?: ProjectCost['category']
  dateFrom?: string
  dateTo?: string
}

export interface RevenueFilters {
  projectId?: number
  status?: ProjectRevenue['status']
  dateFrom?: string
  dateTo?: string
}

// ─── ElectronAPI ──────────────────────────────────────────────────────────────

export interface ElectronAPI {
  getVersion: () => Promise<string>
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
    list: (filters?: DailyLogFilters) => Promise<DailyLogWithRelations[]>
    get: (id: number) => Promise<DailyLogWithRelations | null>
    create: (data: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DailyLog>
    update: (id: number, data: Partial<Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<DailyLog>
    delete: (id: number) => Promise<void>
  }
  costs: {
    list: (filters?: CostFilters) => Promise<ProjectCostWithRelations[]>
    get: (id: number) => Promise<ProjectCostWithRelations | null>
    create: (data: Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectCost>
    update: (id: number, data: Partial<Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<ProjectCost>
    delete: (id: number) => Promise<void>
  }
  revenues: {
    list: (filters?: RevenueFilters) => Promise<ProjectRevenueWithRelations[]>
    get: (id: number) => Promise<ProjectRevenueWithRelations | null>
    create: (data: Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectRevenue>
    update: (id: number, data: Partial<Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<ProjectRevenue>
    delete: (id: number) => Promise<void>
  }
  dashboard: {
    stats: () => Promise<DashboardStats>
  }
  preferences: {
    getSystemLocale: () => Promise<string>
    getSavedLanguage: () => Promise<SupportedLocale | null>
    setLanguage: (language: SupportedLocale) => Promise<SupportedLocale>
  }
  auth: {
    getSession: () => Promise<AuthState>
    signIn: (email: string, password: string) => Promise<AuthState>
    signUp: (email: string, password: string) => Promise<AuthSignUpResult>
    requestPasswordReset: (email: string) => Promise<AuthPasswordResetResult>
    updatePassword: (password: string) => Promise<AuthState>
    signOut: () => Promise<void>
    onSessionChanged: (callback: () => void) => () => void
  }
  users: {
    list: () => Promise<UserProfileListItem[]>
    updateRole: (userId: string, role: AuthRole) => Promise<void>
    delete: (userId: string) => Promise<void>
  }
  license: {
    getStatus: () => Promise<LicenseStatus>
  }
  updater: {
    checkForUpdates: () => Promise<{ success: boolean; updateAvailable: boolean }>
    installUpdate: () => Promise<{ success: boolean }>
    onUpdateAvailable: (callback: (info: unknown) => void) => () => void
    onUpdateDownloaded: (callback: (info: unknown) => void) => () => void
    onDownloadProgress: (callback: (progress: unknown) => void) => () => void
    onError: (callback: (error: unknown) => void) => () => void
    onUpdateNotAvailable: (callback: () => void) => () => void
  }
}

export interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes: string | string[] | null
}

export interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export interface UpdateError {
  message: string
}
