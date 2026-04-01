import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { Dashboard } from './pages/Dashboard'
import { ClientsListPage } from './pages/clients'
import { ClientFormPage } from './pages/clients/ClientFormPage'
import { ClientDetailPage } from './pages/clients/ClientDetailPage'
import { ProjectsListPage } from './pages/projects'
import { ProjectFormPage } from './pages/projects/ProjectFormPage'
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage'
import { MachinesListPage } from './pages/machines'
import { MachineFormPage } from './pages/machines/MachineFormPage'
import { OperatorsListPage } from './pages/operators'
import { OperatorFormPage } from './pages/operators/OperatorFormPage'
import { DailyLogsPage } from './pages/dailylogs'
import { DailyLogFormPage } from './pages/dailylogs/DailyLogFormPage'
import { CostsPage } from './pages/costs'
import { RevenuesPage } from './pages/revenues'
import { ReportsPage } from './pages/reports'

export default function App(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
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
          <Route path="machines/:id/edit" element={<MachineFormPage />} />

          <Route path="operators" element={<OperatorsListPage />} />
          <Route path="operators/new" element={<OperatorFormPage />} />
          <Route path="operators/:id/edit" element={<OperatorFormPage />} />

          <Route path="daily-logs" element={<DailyLogsPage />} />
          <Route path="daily-logs/new" element={<DailyLogFormPage />} />
          <Route path="daily-logs/:id/edit" element={<DailyLogFormPage />} />
          <Route path="costs" element={<CostsPage />} />
          <Route path="revenues" element={<RevenuesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
