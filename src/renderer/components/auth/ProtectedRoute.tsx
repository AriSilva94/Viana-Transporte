import { AuthPage } from '@renderer/pages/auth/AuthPage'
import { useAuth } from '@renderer/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const { state, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,71,116,0.16),_transparent_45%),linear-gradient(180deg,#f6f3ec_0%,#ece6da_100%)] px-6">
        <p className="text-sm font-medium text-muted-foreground">Carregando autenticação...</p>
      </div>
    )
  }

  if (!state?.session) {
    return <AuthPage />
  }

  return <>{children}</>
}

export { ProtectedRoute }
