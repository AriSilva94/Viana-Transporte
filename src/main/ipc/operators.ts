import { getRepository } from '../data/provider'
import type { Operator } from '../../shared/types'
import { handleRead, handleWrite } from './guarded'

export function registerOperatorsHandlers(): void {
  const { operators } = getRepository()

  handleRead(
    'operators:list',
    async (_, filters?: { search?: string; isActive?: boolean }) => {
      return operators.list(filters)
    }
  )

  handleRead('operators:get', async (_, id: number) => {
    return operators.get(id)
  })

  handleWrite(
    'operators:create',
    async (_, data: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>) => {
      return operators.create(data)
    }
  )

  handleWrite(
    'operators:update',
    async (_, id: number, data: Partial<Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>>) => {
      return operators.update(id, data)
    }
  )

  handleWrite('operators:delete', async (_, id: number) => {
    await operators.delete(id)
  })
}
