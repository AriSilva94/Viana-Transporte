import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
} from './credentials'
import type {
  AuthProfile,
  AuthState,
  Client,
  CostFilters,
  DailyLogFilters,
  DailyLogWithRelations,
  Project,
  ProjectFilters,
  ProjectCost,
  ProjectCostWithRelations,
  ProjectRevenue,
  ProjectRevenueWithRelations,
  ProjectWithClient,
  RevenueFilters,
} from '../../../../shared/types'

const API_BASE_URL = process.env.VIANA_API_BASE_URL ?? 'http://localhost:3000/api'

interface ApiAuthResponse {
  accessToken: string
  refreshToken: string
  user?: AuthProfile
}

type CreateClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
type CreateProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
type CreateCostInput = Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>
type CreateRevenueInput = Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>

let authResponse: ApiAuthResponse | null = null

function assertLocalhostOnly(): void {
  if (!API_BASE_URL.startsWith('http://localhost') && !API_BASE_URL.startsWith('http://127.0.0.1')) {
    throw new Error(`E2E API helper refused non-local API URL: ${API_BASE_URL}`)
  }
}

async function login(): Promise<string> {
  const response = await authenticate({ cache: true })
  return response.accessToken
}

async function authenticate({ cache }: { cache: boolean }): Promise<ApiAuthResponse> {
  assertLocalhostOnly()

  if (cache && authResponse) {
    return authResponse
  }

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
    }),
  })

  if (!response.ok) {
    throw new Error(`E2E API login failed: ${response.status} ${await response.text()}`)
  }

  const body = (await response.json()) as ApiAuthResponse
  if (cache) {
    authResponse = body
  }
  return body
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await login()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`E2E API request failed: ${init.method ?? 'GET'} ${path} -> ${response.status} ${await response.text()}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function remove(path: string): Promise<void> {
  await request<void>(path, { method: 'DELETE' })
}

export const e2eApi = {
  async createAuthState(): Promise<AuthState> {
    const auth = await authenticate({ cache: false })
    const profile = auth.user ?? await request<AuthProfile>('/auth/me')

    return {
      session: {
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        userId: profile.id,
        email: profile.email,
        expiresAt: null,
      },
      profile,
      pendingPasswordReset: false,
      pendingPasswordResetToken: null,
    }
  },

  createClient(data: CreateClientInput): Promise<Client> {
    return request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  createProject(data: CreateProjectInput): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  listProjects(filters?: ProjectFilters): Promise<ProjectWithClient[]> {
    return request<ProjectWithClient[]>(`/projects${toQueryString(filters)}`)
  },

  createCost(data: CreateCostInput): Promise<ProjectCost> {
    return request<ProjectCost>('/costs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  listCosts(filters?: CostFilters): Promise<ProjectCostWithRelations[]> {
    return request<ProjectCostWithRelations[]>(`/costs${toQueryString(filters)}`)
  },

  createRevenue(data: CreateRevenueInput): Promise<ProjectRevenue> {
    return request<ProjectRevenue>('/revenues', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  listRevenues(filters?: RevenueFilters): Promise<ProjectRevenueWithRelations[]> {
    return request<ProjectRevenueWithRelations[]>(`/revenues${toQueryString(filters)}`)
  },

  listDailyLogs(filters?: DailyLogFilters): Promise<DailyLogWithRelations[]> {
    return request<DailyLogWithRelations[]>(`/daily-logs${toQueryString(filters)}`)
  },

  deleteCost(id: number): Promise<void> {
    return remove(`/costs/${id}`)
  },

  deleteRevenue(id: number): Promise<void> {
    return remove(`/revenues/${id}`)
  },

  deleteDailyLog(id: number): Promise<void> {
    return remove(`/daily-logs/${id}`)
  },

  deleteProject(id: number): Promise<void> {
    return remove(`/projects/${id}`)
  },

  deleteClient(id: number): Promise<void> {
    return remove(`/clients/${id}`)
  },
}

function toQueryString<T extends object>(filters?: T): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}
