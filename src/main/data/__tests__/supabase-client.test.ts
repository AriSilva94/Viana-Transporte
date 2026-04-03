import { afterEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

import { createSupabaseClientFromEnv } from '../supabase/client'

afterEach(() => {
  createClientMock.mockReset()
})

describe('createSupabaseClientFromEnv', () => {
  it('throws when SUPABASE_URL is missing', async () => {
    const originalUrl = process.env.SUPABASE_URL
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    try {
      delete process.env.SUPABASE_URL
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      await expect(createSupabaseClientFromEnv()).rejects.toThrow('Missing SUPABASE_URL')
    } finally {
      if (originalUrl === undefined) {
        delete process.env.SUPABASE_URL
      } else {
        process.env.SUPABASE_URL = originalUrl
      }

      if (originalKey === undefined) {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY
      } else {
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
      }
    }
  })

  it('throws when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    const originalUrl = process.env.SUPABASE_URL
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    try {
      process.env.SUPABASE_URL = 'https://example.supabase.co'
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      await expect(createSupabaseClientFromEnv()).rejects.toThrow('Missing SUPABASE_SERVICE_ROLE_KEY')
    } finally {
      if (originalUrl === undefined) {
        delete process.env.SUPABASE_URL
      } else {
        process.env.SUPABASE_URL = originalUrl
      }

      if (originalKey === undefined) {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY
      } else {
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
      }
    }
  })

  it('creates the supabase client with env values and disabled session persistence', async () => {
    const originalUrl = process.env.SUPABASE_URL
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const fakeClient = { from: vi.fn() }
    createClientMock.mockReturnValue(fakeClient)

    try {
      process.env.SUPABASE_URL = 'https://example.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

      await expect(createSupabaseClientFromEnv()).resolves.toBe(fakeClient)
      expect(createClientMock).toHaveBeenCalledWith('https://example.supabase.co', 'service-role-key', {
        auth: {
          persistSession: false,
        },
      })
    } finally {
      if (originalUrl === undefined) {
        delete process.env.SUPABASE_URL
      } else {
        process.env.SUPABASE_URL = originalUrl
      }

      if (originalKey === undefined) {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY
      } else {
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
      }
    }
  })
})
