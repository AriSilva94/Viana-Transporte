import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { useAuth } from './context/AuthContext'
import { Dashboard } from './pages/Dashboard'
import { AuthPage } from './pages/auth/AuthPage'
import { ClientsListPage } from './pages/clients'
import { ClientFormPage } from './pages/clients/ClientFormPage'
import { ClientDetailPage } from './pages/clients/ClientDetailPage'
import { ProjectsListPage } from './pages/projects'
import { ProjectFormPage } from './pages/projects/ProjectFormPage'
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage'
import { MachinesListPage } from './pages/machines'
import { MachineFormPage } from './pages/machines/MachineFormPage'
import { MachineDetailPage } from './pages/machines/MachineDetailPage'
import { OperatorsListPage } from './pages/operators'
import { OperatorFormPage } from './pages/operators/OperatorFormPage'
import { OperatorDetailPage } from './pages/operators/OperatorDetailPage'
import { DailyLogsPage } from './pages/dailylogs'
import { DailyLogFormPage } from './pages/dailylogs/DailyLogFormPage'
import { CostsPage } from './pages/costs'
import { CostFormPage } from './pages/costs/CostFormPage'
import { RevenuesPage } from './pages/revenues'
import { RevenueFormPage } from './pages/revenues/RevenueFormPage'
import { ReportsPage } from './pages/reports'
import { api } from './lib/api'
import type { LicenseStatus } from '../shared/license'

export default function App(): JSX.Element {
  const { state: authState, loading: authLoading } = useAuth()
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null)

  useEffect(() => {
    let isMounted = true

    void api.license
      .getStatus()
      .then((status: LicenseStatus) => {
        if (isMounted) {
          setLicenseStatus(status)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLicenseStatus(null)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,71,116,0.16),_transparent_45%),linear-gradient(180deg,#f6f3ec_0%,#ece6da_100%)] px-6">
        <p className="text-sm font-medium text-muted-foreground">Carregando autenticação...</p>
      </div>
    )
  }

  if (!authState?.session) {
    return <AuthPage />
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Shell licenseStatus={licenseStatus} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="clients" element={<ClientsListPage />} />
          <Route path="clients/new" element={<ClientFormPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="clients/:id/edit" element={<ClientFormPage />} />

          <Route path="projects" element={<ProjectsListPage />} />
          <Route path="projects/new" element={<ProjectFormPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/edit" element={<ProjectFormPage />} />

          <Route path="machines" element={<MachinesListPage />} />
          <Route path="machines/new" element={<MachineFormPage />} />
          <Route path="machines/:id" element={<MachineDetailPage />} />
          <Route path="machines/:id/edit" element={<MachineFormPage />} />

          <Route path="operators" element={<OperatorsListPage />} />
          <Route path="operators/new" element={<OperatorFormPage />} />
          <Route path="operators/:id" element={<OperatorDetailPage />} />
          <Route path="operators/:id/edit" element={<OperatorFormPage />} />

          <Route path="daily-logs" element={<DailyLogsPage />} />
          <Route path="daily-logs/new" element={<DailyLogFormPage />} />
          <Route path="daily-logs/:id/edit" element={<DailyLogFormPage />} />
          <Route path="costs" element={<CostsPage />} />
          <Route path="costs/new" element={<CostFormPage />} />
          <Route path="costs/:id/edit" element={<CostFormPage />} />
          <Route path="revenues" element={<RevenuesPage />} />
          <Route path="revenues/new" element={<RevenueFormPage />} />
          <Route path="revenues/:id/edit" element={<RevenueFormPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
