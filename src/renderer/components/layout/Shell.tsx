import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ToastProvider } from '@renderer/context/ToastContext'
import { ToastContainer } from '@renderer/components/ui/toast'

export function Shell(): JSX.Element {
  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-transparent">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-visible">
          <header className="relative z-[60] flex h-20 shrink-0 items-center justify-end border-b border-white/40 bg-white/50 px-6 backdrop-blur-xl lg:px-8">
            <LanguageSwitcher />
          </header>
          <main className="relative z-0 min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <ToastContainer />
    </ToastProvider>
  )
}
