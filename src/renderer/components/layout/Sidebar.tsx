import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Wrench,
  HardHat,
  ClipboardList,
  Receipt,
  TrendingUp,
  BarChart2,
} from 'lucide-react'
import { cn } from '@renderer/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clientes', icon: Users },
  { to: '/projects', label: 'Projetos', icon: FolderOpen },
  { to: '/machines', label: 'Máquinas', icon: Wrench },
  { to: '/operators', label: 'Operadores', icon: HardHat },
  { to: '/daily-logs', label: 'Diários', icon: ClipboardList },
  { to: '/costs', label: 'Custos', icon: Receipt },
  { to: '/revenues', label: 'Receitas', icon: TrendingUp },
  { to: '/reports', label: 'Relatórios', icon: BarChart2 },
]

export function Sidebar(): JSX.Element {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <span className="font-semibold text-sm tracking-wide text-foreground">MightyRept</span>
      </div>
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
