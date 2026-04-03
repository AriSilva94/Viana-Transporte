import { getRepository } from '../data/provider'
import type { Client } from '../../shared/types'
import { handleRead, handleWrite } from './guarded'

export function registerClientsHandlers(): void {
  const { clients } = getRepository()

  handleRead('clients:list', async (_, filters?: { search?: string }) => {
    return clients.list(filters)
  })

  handleRead('clients:get', async (_, id: number) => {
    return clients.get(id)
  })

  handleWrite(
    'clients:create',
    async (_, data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
      return clients.create(data)
    }
  )

  handleWrite(
    'clients:update',
    async (_, id: number, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) => {
      return clients.update(id, data)
    }
  )

  handleWrite('clients:delete', async (_, id: number) => {
    await clients.delete(id)
  })
}
