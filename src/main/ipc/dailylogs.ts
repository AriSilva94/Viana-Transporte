import { getRepository } from '../data/provider'
import type { DailyLog, DailyLogFilters } from '../../shared/types'
import { handleRead, handleWrite } from './guarded'

export function registerDailyLogsHandlers(): void {
  const { dailylogs } = getRepository()

  handleRead('dailylogs:list', async (_, filters: DailyLogFilters | undefined) => dailylogs.list(filters))
  handleRead('dailylogs:get', async (_, id: number) => dailylogs.get(id))
  handleWrite(
    'dailylogs:create',
    async (_, data: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => dailylogs.create(data)
  )
  handleWrite(
    'dailylogs:update',
    async (_, id: number, data: Partial<Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>>) =>
      dailylogs.update(id, data)
  )
  handleWrite('dailylogs:delete', async (_, id: number) => dailylogs.delete(id))
}
