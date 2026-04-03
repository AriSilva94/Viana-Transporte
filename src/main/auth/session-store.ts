import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import type { AuthState } from '../../shared/types'

const AUTH_STATE_FILE = 'auth-session.json'

function createDefaultAuthState(): AuthState {
  return {
    session: null,
    pendingPasswordReset: false,
  }
}

export interface AuthSessionStore {
  readState: () => Promise<AuthState>
  writeState: (state: AuthState) => Promise<void>
  clearState: () => Promise<void>
}

export function getAuthStateFilePath(userDataPath: string): string {
  return join(userDataPath, AUTH_STATE_FILE)
}

export function createAuthSessionStore(userDataPath: string): AuthSessionStore {
  const stateFilePath = getAuthStateFilePath(userDataPath)

  return {
    async readState() {
      try {
        const content = await readFile(stateFilePath, 'utf-8')
        const parsed = JSON.parse(content) as Partial<AuthState> | null
        return {
          session: parsed?.session ?? null,
          pendingPasswordReset: parsed?.pendingPasswordReset ?? false,
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return createDefaultAuthState()
        }

        throw error
      }
    },
    async writeState(state) {
      await mkdir(dirname(stateFilePath), { recursive: true })
      await writeFile(stateFilePath, JSON.stringify(state, null, 2), 'utf-8')
    },
    async clearState() {
      try {
        await unlink(stateFilePath)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error
        }
      }
    },
  }
}
