import type { DataProvider, DomainRepository } from './types'
import { createApiRepository } from './api/repository'

let repository: DomainRepository | null = null

export function resolveDataProviderFromEnv(): DataProvider {
  return 'api'
}

export function setRepository(instance: DomainRepository): void {
  repository = instance
}

export async function initDataProvider(provider: DataProvider): Promise<DataProvider> {
  if (provider !== 'api') {
    throw new Error('This build supports only the NestJS API data provider.')
  }

  repository = createApiRepository()
  return 'api'
}

export function getRepository(): DomainRepository {
  if (!repository) {
    throw new Error('Data repository has not been initialized')
  }

  return repository
}
