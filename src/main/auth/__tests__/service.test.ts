import { afterEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

import { createSupabaseAuthClientFromEnv } from '../client'

afterEach(() => {
  createClientMock.mockReset()
})

describe('createSupabaseAuthClientFromEnv', () => {
  it('throws when SUPABASE_ANON_KEY is missing', async () => {
    const originalUrl = process.env.SUPABASE_URL
    const originalKey = process.env.SUPABASE_ANON_KEY

    try {
      process.env.SUPABASE_URL = 'https://example.supabase.co'
      delete process.env.SUPABASE_ANON_KEY

      await expect(createSupabaseAuthClientFromEnv()).rejects.toThrow('Missing SUPABASE_ANON_KEY')
    } finally {
      if (originalUrl === undefined) {
        delete process.env.SUPABASE_URL
      } else {
        process.env.SUPABASE_URL = originalUrl
      }

      if (originalKey === undefined) {
        delete process.env.SUPABASE_ANON_KEY
      } else {
        process.env.SUPABASE_ANON_KEY = originalKey
      }
    }
  })
})
