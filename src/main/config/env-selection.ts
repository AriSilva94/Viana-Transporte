import { existsSync } from 'fs'
import { resolve } from 'path'

import { config as loadDotenv } from 'dotenv'

export type BuildMode = 'development' | 'production' | 'test'

export interface LoadBuildEnvOptions {
  cwd: string
  mode: BuildMode
  processEnv: NodeJS.ProcessEnv
  envKeys: string[]
}

export function getEnvFilesForMode(mode: BuildMode): string[] {
  if (mode === 'production') {
    return ['.env.production']
  }

  if (mode === 'test') {
    return ['.env.test']
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
