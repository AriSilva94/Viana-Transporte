import { isAbsolute, join } from 'path'

interface ResolveDbPathInput {
  appPath: string
  userDataPath: string
  isPackaged: boolean
  envDbPath?: string
}

export function resolveDbPath(input: ResolveDbPathInput): string {
  if (input.envDbPath && input.envDbPath.trim().length > 0) {
    const candidate = input.envDbPath.trim()
    return isAbsolute(candidate) ? candidate : join(input.appPath, candidate)
  }

  return input.isPackaged
    ? join(input.userDataPath, 'mightyrept.db')
    : join(input.appPath, 'dev.db')
}
