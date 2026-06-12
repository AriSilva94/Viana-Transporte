import { join } from 'path'

const AUTH_STATE_FILE = 'auth-session.json'

export function getAuthStateFilePath(userDataPath: string): string {
  return join(userDataPath, AUTH_STATE_FILE)
}
