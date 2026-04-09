export interface AppLifecycleOptions {
  shouldQuit: boolean
  whenReady: () => Promise<void>
  quit: () => void
  bootstrap: () => Promise<void>
  onError?: (error: unknown) => void
}

export function startAppLifecycle({
  shouldQuit,
  whenReady,
  quit,
  bootstrap,
  onError = (error: unknown) => {
    console.error('Failed to start Viana Transporte:', error)
  },
}: AppLifecycleOptions): void {
  if (shouldQuit) {
    quit()
    return
  }

  void whenReady()
    .then(bootstrap)
    .catch(onError)
}
