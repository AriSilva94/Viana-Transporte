import { getRepository } from '../data/provider'
import type { ProjectRevenue, RevenueFilters } from '../../shared/types'
import { handleRead, handleWrite } from './guarded'

export function registerRevenuesHandlers(): void {
  const { revenues } = getRepository()

  handleRead('revenues:list', async (_, filters: RevenueFilters | undefined) => revenues.list(filters))
  handleRead('revenues:get', async (_, id: number) => revenues.get(id))
  handleWrite(
    'revenues:create',
    async (_, data: Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>) => revenues.create(data)
  )
  handleWrite(
    'revenues:update',
    async (_, id: number, data: Partial<Omit<ProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>>) =>
      revenues.update(id, data)
  )
  handleWrite('revenues:delete', async (_, id: number) => revenues.delete(id))
}
