import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { TFunction } from 'i18next'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { AuthCard } from '@renderer/components/auth/AuthCard'
import { useAuth } from '@renderer/context/AuthContext'
import { useTranslation } from 'react-i18next'
import { FullPageSpinner } from '@renderer/components/shared/FullPageSpinner'
import { LanguageSwitcher } from '@renderer/components/layout/LanguageSwitcher'
import { Eye, EyeOff } from 'lucide-react'
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './authSchemas'

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword'
type TransitionDirection = 'forward' | 'backward'

const AUTH_MODE_ORDER: Record<AuthMode, number> = {
  signIn: 0,
  signUp: 1,
  forgotPassword: 2,
  resetPassword: 3,
}

interface AuthFormValues {
  email: string
  password: string
}

function mapSupabaseError(message: string, t: TFunction): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return t('errors.invalidCredentials')
  if (lower.includes('user already registered')) return t('errors.emailAlreadyRegistered')
  if (lower.includes('email not confirmed')) return t('errors.emailNotConfirmed')
  if (lower.includes('password should be at least')) return t('errors.passwordTooShort')
  if (lower.includes('too many requests') || lower.includes('rate limit'))
    return t('errors.tooManyRequests')
  return t('messages.submitError')
}

interface AuthFormBodyProps {
  mode: AuthMode
}

function AuthFormBody({ mode }: AuthFormBodyProps): JSX.Element {
  const { t } = useTranslation('auth')
  const { signIn, signUp, requestPasswordReset, updatePassword } = useAuth()
  const [message, setMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)

  const schema = React.useMemo(() => {
    if (mode === 'signIn') return signInSchema(t)
    if (mode === 'signUp') return signUpSchema(t)
    if (mode === 'forgotPassword') return forgotPasswordSchema(t)
    return resetPasswordSchema(t)
  }, [mode, t])


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<AuthFormValues>({ resolver: zodResolver(schema as any) })

  const needsPassword = mode === 'signIn' || mode === 'signUp' || mode === 'resetPassword'

  const submitLabelByMode: Record<AuthMode, string> = {
    signIn: t('buttons.signIn'),
    signUp: t('buttons.signUp'),
    forgotPassword: t('buttons.sendReset'),
    resetPassword: t('buttons.updatePassword'),
  }

  const loadingLabelByMode: Record<AuthMode, string> = {
    signIn: t('buttons.loading.signIn'),
    signUp: t('buttons.loading.signUp'),
    forgotPassword: t('buttons.loading.forgotPassword'),
    resetPassword: t('buttons.loading.resetPassword'),
  }

  async function onSubmit(data: AuthFormValues): Promise<void> {
    setMessage(null)
    setErrorMessage(null)

    try {
      if (mode === 'signIn') {
        await signIn(data.email, data.password)
        return
      }

      if (mode === 'signUp') {
        await signUp(data.email, data.password)
        setMessage(t('messages.signUpSuccess'))
        return
      }

      if (mode === 'forgotPassword') {
        await requestPasswordReset(data.email)
        setMessage(t('messages.passwordResetSuccess'))
        return
      }

      await updatePassword(data.password)
      setMessage(t('messages.updatePasswordSuccess'))
    } catch (error) {
      const raw = error instanceof Error && error.message.trim() ? error.message : ''
      const mapped = mapSupabaseError(raw, t)

      setErrorMessage(mapped)
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
      {mode !== 'resetPassword' ? (
        <div className="space-y-2">
          <Label htmlFor="auth-email">{t('fields.email')}</Label>
          <Input
            id="auth-email"
            data-testid="auth-input-email"
            type="email"
            autoComplete="email"
            autoFocus
            disabled={isSubmitting}
            placeholder={t('placeholders.email')}
            {...register('email')}
          />
          {errors.email ? (
            <p className="mt-1 text-sm text-red-600" data-testid="auth-error-email">
              {errors.email.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {needsPassword ? (
        <div className="space-y-2">
          <Label htmlFor="auth-password">
            {mode === 'resetPassword' ? t('fields.newPassword') : t('fields.password')}
          </Label>
          <div className="relative">
            <Input
              id="auth-password"
              data-testid="auth-input-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'resetPassword' ? 'new-password' : 'current-password'}
              autoFocus={mode === 'resetPassword'}
              disabled={isSubmitting}
              placeholder={t('placeholders.password')}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              tabIndex={-1}
              data-testid="auth-toggle-password"
              aria-label={showPassword ? t('fields.hidePassword') : t('fields.showPassword')}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1 text-sm text-red-600" data-testid="auth-error-password">
              {errors.password.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-brand-sand/30 bg-brand-sand/20 px-4 py-3 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        data-testid="auth-submit"
      >
        {isSubmitting ? loadingLabelByMode[mode] : submitLabelByMode[mode]}
      </Button>
    </form>
  )
}

function AuthPage(): JSX.Element {
  const { state, loading } = useAuth()
  const { t } = useTranslation('auth')
  const [mode, setMode] = React.useState<AuthMode>('signIn')
  const [transitionDirection, setTransitionDirection] = React.useState<TransitionDirection>('forward')

  React.useEffect(() => {
    if (state?.pendingPasswordReset && mode !== 'resetPassword') {
      setTransitionDirection(
        AUTH_MODE_ORDER.resetPassword >= AUTH_MODE_ORDER[mode] ? 'forward' : 'backward'
      )
      setMode('resetPassword')
    }
  }, [mode, state?.pendingPasswordReset])

  if (loading) {
    return <FullPageSpinner />
  }

  const titleByMode: Record<AuthMode, string> = {
    signIn: t('modes.signIn.title'),
    signUp: t('modes.signUp.title'),
    forgotPassword: t('modes.requestPasswordReset.title'),
    resetPassword: t('modes.updatePassword.title'),
  }

  const descriptionByMode: Record<AuthMode, string> = {
    signIn: t('modes.signIn.description'),
    signUp: t('modes.signUp.description'),
    forgotPassword: t('modes.requestPasswordReset.description'),
    resetPassword: t('modes.updatePassword.description'),
  }

  function switchMode(nextMode: AuthMode): void {
    setTransitionDirection(
      AUTH_MODE_ORDER[nextMode] >= AUTH_MODE_ORDER[mode] ? 'forward' : 'backward'
    )
    setMode(nextMode)
  }

  const footerByMode: Record<AuthMode, React.ReactNode> = {
    signIn: (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => switchMode('signUp')}
          data-testid="auth-link-to-sign-up"
        >
          {t('buttons.signUp')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => switchMode('forgotPassword')}
          data-testid="auth-link-to-forgot"
        >
          {t('buttons.requestPasswordReset')}
        </Button>
      </div>
    ),
    signUp: (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => switchMode('signIn')}
          data-testid="auth-link-to-sign-in"
        >
          {t('buttons.signIn')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => switchMode('forgotPassword')}
          data-testid="auth-link-to-forgot"
        >
          {t('buttons.requestPasswordReset')}
        </Button>
      </div>
    ),
    forgotPassword: (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => switchMode('signIn')}
          data-testid="auth-link-to-sign-in"
        >
          {t('buttons.signIn')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => switchMode('signUp')}
          data-testid="auth-link-to-sign-up"
        >
          {t('buttons.signUp')}
        </Button>
      </div>
    ),
    resetPassword: (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => switchMode('signIn')}
          data-testid="auth-link-to-sign-in"
        >
          {t('buttons.signIn')}
        </Button>
      </div>
    ),
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,71,116,0.16),_transparent_45%),linear-gradient(180deg,#f6f3ec_0%,#ece6da_100%)] px-6 py-10">
      <div className="absolute right-6 top-4">
        <LanguageSwitcher />
      </div>
      <AuthCard
        title={titleByMode[mode]}
        titleTestId="auth-mode-title"
        description={descriptionByMode[mode]}
        footer={footerByMode[mode]}
      >
        <div
          key={mode}
          className="auth-transition-layer"
          data-testid="auth-transition-layer"
          data-direction={transitionDirection}
        >
          <AuthFormBody mode={mode} />

          {state?.pendingPasswordReset ? (
            <p className="mt-4 text-sm text-secondary">{t('messages.pendingRecovery')}</p>
          ) : null}
        </div>
      </AuthCard>
    </div>
  )
}

export { AuthPage }
