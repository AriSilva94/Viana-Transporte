import { AuthPage } from '@renderer/pages/auth/AuthPage'
import { useAuth } from '@renderer/context/AuthContext'
import { FullPageSpinner } from '@renderer/components/shared/FullPageSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const { state, loading } = useAuth()

  if (loading) {
    return <FullPageSpinner />
  }

  if (!state?.session) {
    return <AuthPage />
  }

  return <>{children}</>
}

export { ProtectedRoute }
