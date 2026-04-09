import { getRepository } from '../data/provider'
import type { Machine } from '../../shared/types'
import { handleRead, handleWrite } from './guarded'

export function registerMachinesHandlers(): void {
  const { machines } = getRepository()

  handleRead(
    'machines:list',
    async (_, filters?: { search?: string; status?: Machine['status'] }) => {
      return machines.list(filters)
    }
  )

  handleRead('machines:get', async (_, id: number) => {
    return machines.get(id)
  })

  handleWrite(
    'machines:create',
    async (_, data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) => {
      return machines.create(data)
    }
  )

  handleWrite(
    'machines:update',
    async (_, id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>) => {
      return machines.update(id, data)
    }
  )

  handleWrite('machines:delete', async (_, id: number) => {
    await machines.delete(id)
  })
}
