import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import { getEnvFilesForMode, loadBuildEnv } from '../env-selection'

describe('getEnvFilesForMode', () => {
  it('returns .env when mode is development', () => {
    expect(getEnvFilesForMode('development')).toEqual(['.env'])
  })

  it('uses production env files when mode is production', () => {
    expect(getEnvFilesForMode('production')).toEqual(['.env.production'])
  })
})

describe('loadBuildEnv', () => {
  it('loads production values from .env.production before falling back to process env', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'env-selection-'))

    try {
      writeFileSync(
        join(tempDir, '.env.production'),
        ['SUPABASE_URL=https://self-hosted.example.com', 'SUPABASE_ANON_KEY=file-anon-key'].join('\n'),
        'utf-8'
      )

      const env = loadBuildEnv({
        cwd: tempDir,
        mode: 'production',
        processEnv: {
          SUPABASE_URL: 'https://cloud.example.com',
          SUPABASE_ANON_KEY: 'cloud-anon-key',
          SUPABASE_SERVICE_ROLE_KEY: 'process-service-role-key',
        },
        envKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
      })

      expect(env).toEqual({
        SUPABASE_URL: 'https://self-hosted.example.com',
        SUPABASE_ANON_KEY: 'file-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'process-service-role-key',
      })
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
