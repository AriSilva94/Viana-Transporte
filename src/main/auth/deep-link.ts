import { app } from 'electron'
import type { AuthService } from './service'

export interface AuthDeepLinkRuntime {
  shouldQuit: boolean
  attachAuthService: (authService: AuthService) => void
}

export function extractDeepLinkUrlFromArgv(argv: string[], protocol = 'mightyrept'): string | null {
  return argv.find((arg) => arg.startsWith(`${protocol}://`)) ?? null
}

function enqueueOrDeliverUrl(getAuthService: () => AuthService | null, pendingUrls: string[], url: string): void {
  const authService = getAuthService()
  if (authService) {
    void authService.handleCallbackUrl(url)
    return
  }

  pendingUrls.push(url)
}

export function createAuthDeepLinkRuntime(): AuthDeepLinkRuntime {
  const pendingUrls: string[] = []
  let authService: AuthService | null = null

  app.setAsDefaultProtocolClient('mightyrept')

  const shouldQuit = !app.requestSingleInstanceLock()
  if (shouldQuit) {
    app.quit()
  }

  const initialDeepLink = extractDeepLinkUrlFromArgv(process.argv)
  if (initialDeepLink) {
    pendingUrls.push(initialDeepLink)
  }

  app.on('second-instance', (_event, argv: string[]) => {
    const deepLink = extractDeepLinkUrlFromArgv(argv)
    if (deepLink) {
      enqueueOrDeliverUrl(() => authService, pendingUrls, deepLink)
    }
  })

  app.on('open-url', (event, url: string) => {
    event.preventDefault()
    enqueueOrDeliverUrl(() => authService, pendingUrls, url)
  })

  return {
    shouldQuit,
    attachAuthService(nextAuthService: AuthService) {
      authService = nextAuthService
      while (pendingUrls.length > 0) {
        const nextUrl = pendingUrls.shift()
        if (nextUrl) {
          void authService.handleCallbackUrl(nextUrl)
        }
      }
    },
  }
}
