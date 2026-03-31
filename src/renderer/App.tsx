import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { Dashboard } from './pages/Dashboard'
import { ClientsPage } from './pages/clients'
import { ProjectsPage } from './pages/projects'
import { MachinesPage } from './pages/machines'
import { OperatorsPage } from './pages/operators'
import { DailyLogsPage } from './pages/dailylogs'
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
          <Route path="clients" element={<ClientsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="machines" element={<MachinesPage />} />
          <Route path="operators" element={<OperatorsPage />} />
          <Route path="daily-logs" element={<DailyLogsPage />} />
          <Route path="costs" element={<CostsPage />} />
          <Route path="revenues" element={<RevenuesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
