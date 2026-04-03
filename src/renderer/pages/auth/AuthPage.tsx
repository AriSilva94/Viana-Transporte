import * as React from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { AuthCard } from '@renderer/components/auth/AuthCard'
import { useAuth } from '@renderer/context/AuthContext'

type AuthMode = 'signIn' | 'signUp' | 'requestPasswordReset' | 'updatePassword'

function AuthPage(): JSX.Element {
  const { state, loading, signIn, signUp, requestPasswordReset, updatePassword } = useAuth()
  const [mode, setMode] = React.useState<AuthMode>('signIn')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [message, setMessage] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (state?.pendingPasswordReset) {
      setMode('updatePassword')
    }
  }, [state?.pendingPasswordReset])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,71,116,0.16),_transparent_45%),linear-gradient(180deg,#f6f3ec_0%,#ece6da_100%)] px-6">
        <p className="text-sm font-medium text-muted-foreground">Carregando autenticação...</p>
      </div>
    )
  }

  const titleByMode: Record<AuthMode, string> = {
    signIn: 'Entrar',
    signUp: 'Criar conta',
    requestPasswordReset: 'Recuperar acesso',
    updatePassword: 'Nova senha',
  }

  const descriptionByMode: Record<AuthMode, string> = {
    signIn: 'Entre para acessar o painel e continuar sua operação.',
    signUp: 'Crie sua conta para iniciar o uso da plataforma.',
    requestPasswordReset: 'Informe seu e-mail para receber o link de redefinição.',
    updatePassword: 'Defina uma nova senha para concluir a recuperação.',
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (mode === 'signIn') {
        await signIn(email, password)
        return
      }

      if (mode === 'signUp') {
        await signUp(email, password)
        setMessage('Conta criada. Verifique seu e-mail.')
        return
      }

      if (mode === 'requestPasswordReset') {
        await requestPasswordReset(email)
        setMessage('Se houver uma conta, você receberá um e-mail de recuperação.')
        return
      }

      await updatePassword(password)
      setMessage('Senha atualizada com sucesso.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const needsPassword = mode === 'signIn' || mode === 'signUp' || mode === 'updatePassword'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,71,116,0.16),_transparent_45%),linear-gradient(180deg,#f6f3ec_0%,#ece6da_100%)] px-6 py-10">
      <AuthCard title={titleByMode[mode]} description={descriptionByMode[mode]}>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" variant={mode === 'signIn' ? 'default' : 'outline'} onClick={() => setMode('signIn')}>
            Entrar
          </Button>
          <Button type="button" variant={mode === 'signUp' ? 'default' : 'outline'} onClick={() => setMode('signUp')}>
            Criar conta
          </Button>
          <Button
            type="button"
            variant={mode === 'requestPasswordReset' ? 'default' : 'outline'}
            onClick={() => setMode('requestPasswordReset')}
          >
            Recuperar senha
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="auth-email">E-mail</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              placeholder="a@b.com"
            />
          </div>

          {needsPassword ? (
            <div className="space-y-2">
              <Label htmlFor="auth-password">
                {mode === 'updatePassword' ? 'Nova senha' : 'Senha'}
              </Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === 'updatePassword' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                placeholder="••••••••"
              />
            </div>
          ) : null}

          {message ? (
            <p className="rounded-2xl border border-brand-sand/30 bg-brand-sand/20 px-4 py-3 text-sm text-foreground">
              {message}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {mode === 'signIn'
              ? 'Entrar'
              : mode === 'signUp'
                ? 'Criar conta'
                : mode === 'requestPasswordReset'
                  ? 'Enviar recuperação'
                  : 'Atualizar senha'}
          </Button>
        </form>

        {state?.pendingPasswordReset ? (
          <p className="mt-4 text-sm text-secondary">
            Recuperação detectada. Use a nova senha para concluir.
          </p>
        ) : null}
      </AuthCard>
    </div>
  )
}

export { AuthPage }
