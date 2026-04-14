import { existsSync } from 'fs'
import { resolve } from 'path'

import { config as loadDotenv } from 'dotenv'

export interface LoadBuildEnvOptions {
  cwd: string
  mode: 'development' | 'production'
  processEnv: NodeJS.ProcessEnv
  envKeys: string[]
}

export function getEnvFilesForMode(mode: 'development' | 'production'): string[] {
  if (mode === 'production') {
    return ['.env.production']
  }

  return ['.env']
}

export function loadBuildEnv({
  cwd,
  mode,
  processEnv,
  envKeys,
}: LoadBuildEnvOptions): Record<string, string> {
  const buildEnv: Record<string, string> = {}

  for (const file of getEnvFilesForMode(mode)) {
    const envPath = resolve(cwd, file)
    if (!existsSync(envPath)) {
      continue
    }

    const result = loadDotenv({ path: envPath, processEnv: {} })
    if (result.parsed) {
      Object.assign(buildEnv, result.parsed)
    }
  }

  for (const key of envKeys) {
    if (!buildEnv[key] && processEnv[key]) {
      buildEnv[key] = processEnv[key]!
    }
  }

  return buildEnv
}
