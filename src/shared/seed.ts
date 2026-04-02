export interface DatabaseSeedProbe {
  clientsCount: number
  projectsCount: number
  revenuesCount: number
  costsCount: number
}

export function shouldSeedInitialData(probe: DatabaseSeedProbe): boolean {
  return (
    probe.clientsCount === 0 &&
    probe.projectsCount === 0 &&
    probe.revenuesCount === 0 &&
    probe.costsCount === 0
  )
}
