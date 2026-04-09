import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseRepositoryMock } = vi.hoisted(() => ({
  createSupabaseRepositoryMock: vi.fn(),
}))

vi.mock('../supabase/repository', () => ({
  createSupabaseRepository: createSupabaseRepositoryMock,
}))

import { getRepository, initDataProvider } from '../provider'

describe('initDataProvider', () => {
  beforeEach(() => {
    createSupabaseRepositoryMock.mockReset()
  })

  it('wraps supabase init failures and keeps repository uninitialized', async () => {
    createSupabaseRepositoryMock.mockRejectedValue(new Error('boom'))

    await expect(initDataProvider('supabase')).rejects.toThrow(
      'Failed to initialize Supabase data provider: boom'
    )
    expect(() => getRepository()).toThrow('Data repository has not been initialized')
  })
})
