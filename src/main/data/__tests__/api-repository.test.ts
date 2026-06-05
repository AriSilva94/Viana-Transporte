import { describe, expect, it } from 'vitest'
import { createApiRepository, loadDashboardStats } from '../api/repository'
import type { ApiHttpClient } from '../../api/http'

function createClient(responses: Record<string, unknown>): ApiHttpClient {
  return {
    get: async (path: string) => responses[path],
    post: async () => {
      throw new Error('not implemented')
    },
    patch: async () => {
      throw new Error('not implemented')
    },
    delete: async () => {
      throw new Error('not implemented')
    },
  } as unknown as ApiHttpClient
}

describe('createApiRepository', () => {
  it('converte decimais serializados pela API para number', async () => {
    const repository = createApiRepository(
      createClient({
        '/costs': [
          {
            id: 1,
            date: '2026-06-04',
            projectId: 1,
            machineId: null,
            operatorId: null,
            dailyLogId: null,
            category: 'fuel',
            description: 'Diesel',
            amount: '720.45',
            notes: null,
            projectName: 'Financeiro',
            machineName: null,
            operatorName: null,
            dailyLogComputedValue: '1000.50',
            createdAt: '2026-06-04T12:00:00.000Z',
            updatedAt: '2026-06-04T12:00:00.000Z',
          },
        ],
        '/revenues': [
          {
            id: 1,
            date: '2026-06-04',
            projectId: 1,
            dailyLogId: null,
            description: 'Frete',
            amount: '1800.99',
            status: 'received',
            notes: null,
            projectName: 'Financeiro',
            dailyLogComputedValue: null,
            createdAt: '2026-06-04T12:00:00.000Z',
            updatedAt: '2026-06-04T12:00:00.000Z',
          },
        ],
        '/daily-logs': [
          {
            id: 1,
            date: '2026-06-04',
            projectId: 1,
            machineId: null,
            operatorId: null,
            hoursWorked: '8.5',
            workDescription: null,
            fuelQuantity: '20.25',
            downtimeNotes: null,
            notes: null,
            km: '120',
            percentage: null,
            toll: '97.80',
            tonnage: '22.6',
            projectName: 'Financeiro',
            machineName: null,
            operatorName: null,
            createdAt: '2026-06-04T12:00:00.000Z',
            updatedAt: '2026-06-04T12:00:00.000Z',
          },
        ],
      })
    )

    const [cost] = await repository.costs.list()
    const [revenue] = await repository.revenues.list()
    const [dailyLog] = await repository.dailylogs.list()

    expect(cost.amount).toBe(720.45)
    expect(cost.dailyLogComputedValue).toBe(1000.5)
    expect(revenue.amount).toBe(1800.99)
    expect(dailyLog.hoursWorked).toBe(8.5)
    expect(dailyLog.fuelQuantity).toBe(20.25)
    expect(dailyLog.toll).toBe(97.8)
  })
})

describe('loadDashboardStats', () => {
  it('converte totais agregados serializados pela API para number', async () => {
    const stats = await loadDashboardStats(
      createClient({
        '/dashboard/stats': {
          activeProjects: 1,
          completedProjects: 1,
          totalMachines: 0,
          allocatedMachines: 0,
          totalCosts: '720.45',
          totalRevenues: '1800.99',
          estimatedProfit: '1080.54',
          recentLogs: [],
        },
      })
    )

    expect(stats.totalCosts).toBe(720.45)
    expect(stats.totalRevenues).toBe(1800.99)
    expect(stats.estimatedProfit).toBe(1080.54)
  })
})
