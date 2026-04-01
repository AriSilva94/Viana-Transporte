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
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-brand-deep text-white shadow-[12px_0_40px_rgba(34,49,95,0.16)]">
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.28em] text-brand-sand/80">
            MightyRept
          </span>
          <span className="mt-1 block text-sm text-white/72">Gestao operacional e financeira</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                isActive
                  ? 'bg-brand-sand text-brand-ink shadow-sm'
                  : 'text-white/72 hover:bg-white/10 hover:text-white'
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
