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
  it('throws when SUPABASE_URL is missing', async () => {
    const originalUrl = process.env.SUPABASE_URL
    const originalKey = process.env.SUPABASE_ANON_KEY

    try {
      delete process.env.SUPABASE_URL
      process.env.SUPABASE_ANON_KEY = 'test-anon-key'

      await expect(createSupabaseAuthClientFromEnv()).rejects.toThrow('Missing SUPABASE_URL')
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

  it('creates the auth client with env values and disabled session persistence', async () => {
    const originalUrl = process.env.SUPABASE_URL
    const originalKey = process.env.SUPABASE_ANON_KEY
    const fakeClient = { auth: { getSession: vi.fn() } }

    createClientMock.mockReturnValue(fakeClient)

    try {
      process.env.SUPABASE_URL = 'https://example.supabase.co'
      process.env.SUPABASE_ANON_KEY = 'test-anon-key'

      await expect(createSupabaseAuthClientFromEnv()).resolves.toBe(fakeClient)
      expect(createClientMock).toHaveBeenCalledWith('https://example.supabase.co', 'test-anon-key', {
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
        delete process.env.SUPABASE_ANON_KEY
      } else {
        process.env.SUPABASE_ANON_KEY = originalKey
      }
    }
  })
})
