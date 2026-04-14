import * as React from 'react'
import type { AuthState } from '../../shared/types'

const AUTH_SESSION_REFRESH_INTERVAL_MS = 30_000

interface AuthContextValue {
  state: AuthState | null
  loading: boolean
  refresh: () => Promise<AuthState>
  signIn: (email: string, password: string) => Promise<AuthState>
  signUp: (email: string, password: string) => Promise<unknown>
  requestPasswordReset: (email: string) => Promise<unknown>
  updatePassword: (password: string) => Promise<AuthState>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }

  return context
}

function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [state, setState] = React.useState<AuthState | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async (): Promise<AuthState> => {
    try {
      const nextState = await window.api.auth.getSession()
      setState(nextState)
      return nextState
    } catch {
      const safeState: AuthState = { session: null, profile: null, pendingPasswordReset: false }
      setState(safeState)
      return safeState
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  React.useEffect(() => {
    return window.api.auth.onSessionChanged(() => {
      void refresh()
    })
  }, [refresh])

  React.useEffect(() => {
    if (!state?.session) {
      return
    }

    const intervalId = window.setInterval(() => {
      void refresh()
    }, AUTH_SESSION_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [refresh, state?.session])

  const signIn = React.useCallback(async (email: string, password: string): Promise<AuthState> => {
    const nextState = await window.api.auth.signIn(email, password)
    setState(nextState)
    return nextState
  }, [])

  const signUp = React.useCallback(async (email: string, password: string): Promise<unknown> => {
    try {
      const result = await window.api.auth.signUp(email, password)
      console.log('[AuthContext] signUp success:', result)
      console.log('[AuthContext] signUp emailConfirmationSent:', result?.emailConfirmationSent)
      return result
    } catch (error) {
      console.log('[AuthContext] signUp error:', error)
      console.log('[AuthContext] signUp error message:', error instanceof Error ? error.message : 'unknown')
      console.log('[AuthContext] signUp error type:', error instanceof Error ? error.constructor.name : typeof error)
      throw error
    }
  }, [])

  const requestPasswordReset = React.useCallback(async (email: string): Promise<unknown> => {
    const result = await window.api.auth.requestPasswordReset(email)
    await refresh()
    return result
  }, [refresh])

  const updatePassword = React.useCallback(async (password: string): Promise<AuthState> => {
    const nextState = await window.api.auth.updatePassword(password)
    setState(nextState)
    return nextState
  }, [])

  const signOut = React.useCallback(async (): Promise<void> => {
    await window.api.auth.signOut()
    const nextState: AuthState = { session: null, profile: null, pendingPasswordReset: false }
    setState(nextState)
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      state,
      loading,
      refresh,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      signOut,
    }),
    [loading, refresh, requestPasswordReset, signIn, signOut, signUp, state, updatePassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider, useAuth }
