import { describe, expect, it } from 'vitest'
import { resolveDbPath } from '../../shared/db-path'
import { resolveDataProviderFromEnv } from '../../main/data/provider'

describe('resolveDbPath', () => {
  it('uses env override absolute path when provided', () => {
    const resolved = resolveDbPath({
      appPath: 'C:/app',
      userDataPath: 'C:/users/data',
      isPackaged: false,
      envDbPath: 'C:/tmp/e2e.db',
    })

    expect(resolved).toBe('C:/tmp/e2e.db')
  })

  it('uses env override relative path joined with app path', () => {
    const resolved = resolveDbPath({
      appPath: 'C:/app',
      userDataPath: 'C:/users/data',
      isPackaged: false,
      envDbPath: 'tmp/e2e.db',
    })

    expect(resolved.replaceAll('\\', '/')).toBe('C:/app/tmp/e2e.db')
  })

  it('uses dev default path when unpackaged and env is absent', () => {
    const resolved = resolveDbPath({
      appPath: 'C:/app',
      userDataPath: 'C:/users/data',
      isPackaged: false,
    })

    expect(resolved.replaceAll('\\', '/')).toBe('C:/app/dev.db')
  })

  it('uses userData default path when packaged and env is absent', () => {
    const resolved = resolveDbPath({
      appPath: 'C:/app',
      userDataPath: 'C:/users/data',
      isPackaged: true,
    })

    expect(resolved.replaceAll('\\', '/')).toBe('C:/users/data/mightyrept.db')
  })

  it('resolves supabase provider from env', () => {
    const originalProvider = process.env.MIGHTYREPT_DATA_PROVIDER

    try {
      process.env.MIGHTYREPT_DATA_PROVIDER = 'supabase'

      expect(resolveDataProviderFromEnv()).toBe('supabase')
    } finally {
      if (originalProvider === undefined) {
        delete process.env.MIGHTYREPT_DATA_PROVIDER
      } else {
        process.env.MIGHTYREPT_DATA_PROVIDER = originalProvider
      }
    }
  })
})
