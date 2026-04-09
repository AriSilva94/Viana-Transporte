import { getRepository } from '../data/provider'
import type { CostFilters, ProjectCost } from '../../shared/types'
import { handleRead, handleWrite } from './guarded'

export function registerCostsHandlers(): void {
  const { costs } = getRepository()

  handleRead('costs:list', async (_, filters: CostFilters | undefined) => costs.list(filters))
  handleRead('costs:get', async (_, id: number) => costs.get(id))
  handleWrite(
    'costs:create',
    async (_, data: Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>) => costs.create(data)
  )
  handleWrite(
    'costs:update',
    async (_, id: number, data: Partial<Omit<ProjectCost, 'id' | 'createdAt' | 'updatedAt'>>) =>
      costs.update(id, data)
  )
  handleWrite('costs:delete', async (_, id: number) => costs.delete(id))
}
