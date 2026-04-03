import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ToastProvider } from '@renderer/context/ToastContext'
import { ToastContainer } from '@renderer/components/ui/toast'
import { Button } from '@renderer/components/ui/button'
import { useAuth } from '@renderer/context/AuthContext'
import type { LicenseStatus } from '../../../shared/license'

interface ShellProps {
  licenseStatus: LicenseStatus | null
}

function formatDate(value: number | null): string | null {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value)
}

function buildLicenseMessage(licenseStatus: LicenseStatus | null): string | null {
  if (!licenseStatus || licenseStatus.distributionMode === 'full') {
    return null
  }

  const expiresAtLabel = formatDate(licenseStatus.expiresAtMs)
  if (licenseStatus.readOnly) {
    return `Avaliacao expirada${expiresAtLabel ? ` em ${expiresAtLabel}` : ''}. Modo somente visualizacao.`
  }

  if (!expiresAtLabel || licenseStatus.daysRemaining === null) {
    return 'Versao de avaliacao ativa.'
  }

  const suffix = licenseStatus.daysRemaining === 1 ? 'dia' : 'dias'
  return `Versao de avaliacao: expira em ${expiresAtLabel} (${licenseStatus.daysRemaining} ${suffix} restantes).`
}

export function Shell({ licenseStatus }: ShellProps): JSX.Element {
  const { signOut } = useAuth()
  const licenseMessage = buildLicenseMessage(licenseStatus)

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-transparent">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-visible">
          <header className="relative z-[60] flex min-h-20 shrink-0 items-center justify-between gap-4 border-b border-white/40 bg-white/50 px-6 py-3 backdrop-blur-xl lg:px-8">
            <div className="min-w-0">
              {licenseMessage ? (
                <p className="inline-flex items-center rounded-full border border-brand-orange/30 bg-brand-orange/15 px-3 py-1 text-xs font-semibold text-brand-ink">
                  {licenseMessage}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button type="button" variant="outline" onClick={() => void signOut()} data-testid="logout-button">
                Sair
              </Button>
            </div>
          </header>
          <main className="relative z-0 min-h-0 flex-1 overflow-hidden p-6 lg:p-8">
            <div className="h-full overflow-y-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <ToastContainer />
    </ToastProvider>
  )
}
