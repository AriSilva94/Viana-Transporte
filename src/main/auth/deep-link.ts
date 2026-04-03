import { app } from 'electron'
import type { AuthService } from './service'

export function extractDeepLinkUrlFromArgv(argv: string[], protocol = 'mightyrept'): string | null {
  return argv.find((arg) => arg.startsWith(`${protocol}://`)) ?? null
}

export function registerAuthDeepLinkHandlers(authService: AuthService): void {
  app.setAsDefaultProtocolClient('mightyrept')

  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return
  }

  app.on('second-instance', (_event, argv: string[]) => {
    const deepLink = extractDeepLinkUrlFromArgv(argv)
    if (deepLink) {
      void authService.handleCallbackUrl(deepLink)
    }
  })

  app.on('open-url', (event, url: string) => {
    event.preventDefault()
    void authService.handleCallbackUrl(url)
  })
}
