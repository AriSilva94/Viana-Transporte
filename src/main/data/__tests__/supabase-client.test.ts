import { describe, expect, it } from 'vitest'
import { createSupabaseClientFromEnv } from '../supabase/client'

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
})
