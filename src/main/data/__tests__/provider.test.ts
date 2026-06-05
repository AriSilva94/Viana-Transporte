import { describe, expect, it } from 'vitest'
import { getRepository, initDataProvider, resolveDataProviderFromEnv } from '../provider'

describe('initDataProvider', () => {
  it('initializes the NestJS API provider only', async () => {
    expect(resolveDataProviderFromEnv()).toBe('api')
    await expect(initDataProvider('api')).resolves.toBe('api')
    expect(getRepository()).toBeTruthy()
  })
})
