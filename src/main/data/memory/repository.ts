import type {
  Client,
  CostFilters,
  DailyLog,
  DailyLogFilters,
  DailyLogWithRelations,
  Machine,
  Operator,
  Project,
  ProjectCost,
  ProjectCostWithRelations,
  ProjectFilters,
  ProjectRevenue,
  ProjectRevenueWithRelations,
  ProjectSummary,
  ProjectWithClient,
  RevenueFilters,
} from '../../../shared/types'
import { computeDailyLogValue } from '../../../shared/dailyLogValue'
import type { DomainRepository } from '../types'

interface Sequence {
  next(): number
}

function createSequence(): Sequence {
  let value = 0
  return {
    next() {
      value += 1
      return value
    },
  }
}

function nowStamps(): { createdAt: Date; updatedAt: Date } {
  const now = new Date()
  return { createdAt: now, updatedAt: now }
}

function ilike(value: string | null | undefined, term: string): boolean {
  if (!value) return false
  return value.toLowerCase().includes(term.toLowerCase())
}

function clone<T>(value: T): T {
  return value === null || value === undefined ? value : JSON.parse(JSON.stringify(value), reviveDates) as T
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

function reviveDates(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
    return new Date(value)
  }
  return value
}

export function createMemoryRepository(): DomainRepository {
  const clients = new Map<number, Client>()
  const projects = new Map<number, Project>()
  const machines = new Map<number, Machine>()
  const operators = new Map<number, Operator>()
  const dailyLogs = new Map<number, DailyLog>()
  const projectCosts = new Map<number, ProjectCost>()
  const projectRevenues = new Map<number, ProjectRevenue>()

  const clientSeq = createSequence()
  const projectSeq = createSequence()
  const machineSeq = createSequence()
  const operatorSeq = createSequence()
  const dailyLogSeq = createSequence()
  const costSeq = createSequence()
  const revenueSeq = createSequence()

  function projectWithClient(project: Project): ProjectWithClient {
    const client = clients.get(project.clientId)
    return { ...clone(project), clientName: client?.name ?? null }
  }

  function dailyLogWithRelations(log: DailyLog): DailyLogWithRelations {
    return {
      ...clone(log),
      projectName: projects.get(log.projectId)?.name ?? null,
      machineName: log.machineId ? machines.get(log.machineId)?.name ?? null : null,
      operatorName: log.operatorId ? operators.get(log.operatorId)?.name ?? null : null,
    }
  }

  function costWithRelations(cost: ProjectCost): ProjectCostWithRelations {
    return {
      ...clone(cost),
      projectName: projects.get(cost.projectId)?.name ?? null,
      machineName: cost.machineId ? machines.get(cost.machineId)?.name ?? null : null,
      operatorName: cost.operatorId ? operators.get(cost.operatorId)?.name ?? null : null,
      dailyLogComputedValue: cost.dailyLogId ? computedFromDailyLog(cost.dailyLogId) : null,
    }
  }

  function revenueWithRelations(revenue: ProjectRevenue): ProjectRevenueWithRelations {
    return {
      ...clone(revenue),
      projectName: projects.get(revenue.projectId)?.name ?? null,
      dailyLogComputedValue: revenue.dailyLogId ? computedFromDailyLog(revenue.dailyLogId) : null,
    }
  }

  function computedFromDailyLog(id: number): number | null {
    const log = dailyLogs.get(id)
    if (!log) return null
    return computeDailyLogValue({
      tonnage: log.tonnage,
      percentage: log.percentage,
      km: log.km,
      toll: log.toll,
    })
  }

  function withinDateRange(date: Date, from?: string, to?: string): boolean {
    if (from && date < new Date(from)) return false
    if (to && date > new Date(`${to}T23:59:59.999Z`)) return false
    return true
  }

  return {
    clients: {
      async list(filters) {
        let rows = Array.from(clients.values())
        if (filters?.search?.trim()) {
          const term = filters.search.trim()
          rows = rows.filter((r) => ilike(r.name, term))
        }
        return rows.map(clone)
      },
      async get(id) {
        const row = clients.get(id)
        return row ? clone(row) : null
      },
      async create(data) {
        const id = clientSeq.next()
        const row: Client = { id, ...data, ...nowStamps() }
        clients.set(id, row)
        return clone(row)
      },
      async update(id, data) {
        const existing = clients.get(id)
        if (!existing) throw new Error(`Client ${id} not found`)
        const updated: Client = { ...existing, ...data, updatedAt: new Date() }
        clients.set(id, updated)
        return clone(updated)
      },
      async delete(id) {
        clients.delete(id)
      },
    },

    projects: {
      async list(filters) {
        let rows = Array.from(projects.values())
        if (filters?.status) rows = rows.filter((r) => r.status === filters.status)
        if (filters?.clientId !== undefined) rows = rows.filter((r) => r.clientId === filters.clientId)
        if (filters?.search?.trim()) {
          const term = filters.search.trim()
          rows = rows.filter((r) => ilike(r.name, term))
        }
        return rows.map(projectWithClient)
      },
      async get(id) {
        const row = projects.get(id)
        return row ? projectWithClient(row) : null
      },
      async create(data) {
        const id = projectSeq.next()
        const row: Project = { id, ...data, ...nowStamps() }
        projects.set(id, row)
        return clone(row)
      },
      async update(id, data) {
        const existing = projects.get(id)
        if (!existing) throw new Error(`Project ${id} not found`)
        const updated: Project = { ...existing, ...data, updatedAt: new Date() }
        projects.set(id, updated)
        return clone(updated)
      },
      async delete(id) {
        projects.delete(id)
      },
      async summary(id) {
        const costs = Array.from(projectCosts.values()).filter((c) => c.projectId === id)
        const revenues = Array.from(projectRevenues.values()).filter((r) => r.projectId === id)
        const logs = Array.from(dailyLogs.values()).filter((l) => l.projectId === id)
        const totalCosts = costs.reduce((acc, c) => acc + Number(c.amount ?? 0), 0)
        const totalRevenues = revenues.reduce((acc, r) => acc + Number(r.amount ?? 0), 0)
        const totalHours = logs.reduce((acc, l) => acc + Number(l.hoursWorked ?? 0), 0)
        const summary: ProjectSummary = {
          totalCosts,
          totalRevenues,
          profit: totalRevenues - totalCosts,
          totalHours,
        }
        return summary
      },
    },

    machines: {
      async list(filters) {
        let rows = Array.from(machines.values())
        if (filters?.status) rows = rows.filter((r) => r.status === filters.status)
        if (filters?.search?.trim()) {
          const term = filters.search.trim()
          rows = rows.filter((r) => ilike(r.name, term) || ilike(r.type, term))
        }
        return rows.map(clone)
      },
      async get(id) {
        const row = machines.get(id)
        return row ? clone(row) : null
      },
      async create(data) {
        const id = machineSeq.next()
        const row: Machine = { id, ...data, ...nowStamps() }
        machines.set(id, row)
        return clone(row)
      },
      async update(id, data) {
        const existing = machines.get(id)
        if (!existing) throw new Error(`Machine ${id} not found`)
        const updated: Machine = { ...existing, ...data, updatedAt: new Date() }
        machines.set(id, updated)
        return clone(updated)
      },
      async delete(id) {
        machines.delete(id)
      },
    },

    operators: {
      async list(filters) {
        let rows = Array.from(operators.values())
        if (filters?.isActive !== undefined) rows = rows.filter((r) => r.isActive === filters.isActive)
        if (filters?.search?.trim()) {
          const term = filters.search.trim()
          rows = rows.filter((r) => ilike(r.name, term))
        }
        return rows.map(clone)
      },
      async get(id) {
        const row = operators.get(id)
        return row ? clone(row) : null
      },
      async create(data) {
        const id = operatorSeq.next()
        const row: Operator = { id, ...data, ...nowStamps() }
        operators.set(id, row)
        return clone(row)
      },
      async update(id, data) {
        const existing = operators.get(id)
        if (!existing) throw new Error(`Operator ${id} not found`)
        const updated: Operator = { ...existing, ...data, updatedAt: new Date() }
        operators.set(id, updated)
        return clone(updated)
      },
      async delete(id) {
        operators.delete(id)
      },
    },

    dailylogs: {
      async list(filters?: DailyLogFilters) {
        let rows = Array.from(dailyLogs.values())
        if (filters?.projectId !== undefined) rows = rows.filter((r) => r.projectId === filters.projectId)
        if (filters?.machineId !== undefined) rows = rows.filter((r) => r.machineId === filters.machineId)
        if (filters?.operatorId !== undefined) rows = rows.filter((r) => r.operatorId === filters.operatorId)
        rows = rows.filter((r) => withinDateRange(new Date(r.date), filters?.dateFrom, filters?.dateTo))
        return rows.map(dailyLogWithRelations)
      },
      async get(id) {
        const row = dailyLogs.get(id)
        return row ? dailyLogWithRelations(row) : null
      },
      async create(data) {
        const id = dailyLogSeq.next()
        const row: DailyLog = { id, ...data, ...nowStamps() }
        dailyLogs.set(id, row)
        return clone(row)
      },
      async update(id, data) {
        const existing = dailyLogs.get(id)
        if (!existing) throw new Error(`DailyLog ${id} not found`)
        const updated: DailyLog = { ...existing, ...data, updatedAt: new Date() }
        dailyLogs.set(id, updated)
        return clone(updated)
      },
      async delete(id) {
        dailyLogs.delete(id)
      },
    },

    costs: {
      async list(filters?: CostFilters) {
        let rows = Array.from(projectCosts.values())
        if (filters?.projectId !== undefined) rows = rows.filter((r) => r.projectId === filters.projectId)
        if (filters?.category) rows = rows.filter((r) => r.category === filters.category)
        rows = rows.filter((r) => withinDateRange(new Date(r.date), filters?.dateFrom, filters?.dateTo))
        return rows.map(costWithRelations)
      },
      async get(id) {
        const row = projectCosts.get(id)
        return row ? costWithRelations(row) : null
      },
      async create(data) {
        const id = costSeq.next()
        const row: ProjectCost = { id, ...data, ...nowStamps() }
        projectCosts.set(id, row)
        return clone(row)
      },
      async update(id, data) {
        const existing = projectCosts.get(id)
        if (!existing) throw new Error(`Cost ${id} not found`)
        const updated: ProjectCost = { ...existing, ...data, updatedAt: new Date() }
        projectCosts.set(id, updated)
        return clone(updated)
      },
      async delete(id) {
        projectCosts.delete(id)
      },
    },

    revenues: {
      async list(filters?: RevenueFilters) {
        let rows = Array.from(projectRevenues.values())
        if (filters?.projectId !== undefined) rows = rows.filter((r) => r.projectId === filters.projectId)
        if (filters?.status) rows = rows.filter((r) => r.status === filters.status)
        rows = rows.filter((r) => withinDateRange(new Date(r.date), filters?.dateFrom, filters?.dateTo))
        return rows.map(revenueWithRelations)
      },
      async get(id) {
        const row = projectRevenues.get(id)
        return row ? revenueWithRelations(row) : null
      },
      async create(data) {
        const id = revenueSeq.next()
        const row: ProjectRevenue = { id, ...data, ...nowStamps() }
        projectRevenues.set(id, row)
        return clone(row)
      },
      async update(id, data) {
        const existing = projectRevenues.get(id)
        if (!existing) throw new Error(`Revenue ${id} not found`)
        const updated: ProjectRevenue = { ...existing, ...data, updatedAt: new Date() }
        projectRevenues.set(id, updated)
        return clone(updated)
      },
      async delete(id) {
        projectRevenues.delete(id)
      },
    },
  }
}
