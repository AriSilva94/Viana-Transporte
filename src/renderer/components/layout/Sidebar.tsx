import { useEffect, useState } from 'react'
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
  Shield,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@renderer/lib/utils'
import logo from '@renderer/assets/img/logo.png'
import { useAuth } from '@renderer/context/AuthContext'

const baseNavItems = [
  { to: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { to: '/clients', labelKey: 'clients', icon: Users },
  { to: '/projects', labelKey: 'projects', icon: FolderOpen },
  { to: '/machines', labelKey: 'machines', icon: Wrench },
  { to: '/operators', labelKey: 'operators', icon: HardHat },
  { to: '/daily-logs', labelKey: 'dailylogs', icon: ClipboardList },
  { to: '/costs', labelKey: 'costs', icon: Receipt },
  { to: '/revenues', labelKey: 'revenues', icon: TrendingUp },
  { to: '/reports', labelKey: 'reports', icon: BarChart2 },
]

export function Sidebar(): JSX.Element {
  const { t } = useTranslation('navigation')
  const { state } = useAuth()
  const [version, setVersion] = useState('')
  const isAdminOrOwner = state?.profile?.role === 'admin' || state?.profile?.role === 'owner'

  const navItems = isAdminOrOwner
    ? [...baseNavItems, { to: '/users', labelKey: 'users', icon: Shield }]
    : baseNavItems

  useEffect(() => {
    window.api.getVersion().then(setVersion)
  }, [])

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-brand-deep text-white shadow-[12px_0_40px_rgba(34,49,95,0.16)]">
      <div className="flex flex-col items-center gap-2 border-b border-white/10 px-5 py-5">
        <img src={logo} alt="Viana Transporte" className="h-20 w-20 shrink-0 object-contain" />
        <span className="text-base font-bold tracking-wide text-white">Viana Transporte</span>
        <span className="text-xs text-white/60">{t('appTagline')}</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, labelKey, icon: Icon }) => (
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
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
      {state?.session?.email && (
        <p className="px-5 pb-2 text-center text-xs text-white/60 truncate" title={state.session.email}>
          {state.session.email}
        </p>
      )}
      {version && (
        <div className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/40">
          v{version}
        </div>
      )}
    </aside>
  )
}
