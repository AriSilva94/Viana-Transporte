import { getRepository } from '../data/provider'
import type { Project, ProjectFilters } from '../../shared/types'
import { handleRead, handleWrite } from './guarded'

export function registerProjectsHandlers(): void {
  const { projects } = getRepository()

  handleRead('projects:list', async (_, filters?: ProjectFilters) => {
    return projects.list(filters)
  })

  handleRead('projects:get', async (_, id: number) => {
    return projects.get(id)
  })

  handleWrite(
    'projects:create',
    async (_, data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      return projects.create(data)
    }
  )

  handleWrite(
    'projects:update',
    async (_, id: number, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
      return projects.update(id, data)
    }
  )

  handleWrite('projects:delete', async (_, id: number) => {
    await projects.delete(id)
  })

  handleRead('projects:summary', async (_, id: number) => {
    return projects.summary(id)
  })
}
