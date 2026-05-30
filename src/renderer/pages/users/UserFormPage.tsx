import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { FormCard } from '@renderer/components/shared/FormCard'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { Label } from '@renderer/components/ui/label'
import { useToast } from '@renderer/context/ToastContext'
import { api } from '@renderer/lib/api'
import { findUserById, mapUsersErrorMessage } from './userHelpers'
import type { AuthRole, UserProfileListItem } from '../../../shared/types'

type FormValues = {
  role: AuthRole
}

export function UserFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['users', 'common'])
  const { showToast } = useToast()
  const [user, setUser] = useState<UserProfileListItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const { control, handleSubmit, reset, setError, formState: { errors } } = useForm<FormValues>({
    defaultValues: { role: 'employee' },
  })

  useEffect(() => {
    let isMounted = true

    async function loadUser(): Promise<void> {
      if (!id) {
        setIsFetching(false)
        return
      }

      try {
        const foundUser = await findUserById(id)
        if (!isMounted) return
        setUser(foundUser)
        reset({ role: foundUser?.role ?? 'employee' })
      } finally {
        if (isMounted) {
          setIsFetching(false)
        }
      }
    }

    void loadUser()

    return () => {
      isMounted = false
    }
  }, [id, reset])

  async function onSubmit(values: FormValues): Promise<void> {
    if (!user) return
    setIsLoading(true)
    try {
      await api.users.updateRole(user.id, values.role)
      showToast(t('updateSuccess'))
      navigate('/users')
    } catch (submitError) {
      const message = mapUsersErrorMessage(submitError, t)
      showToast(message, 'error')
      setError('role', { message })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <FormCard
        title={t('editDialogTitle')}
        description={t('formDescription')}
        onSubmit={(event) => event.preventDefault()}
        onCancel={() => navigate('/users')}
        isLoading
      >
        <p className="text-sm text-muted-foreground">{t('common:loading')}</p>
      </FormCard>
    )
  }

  if (!user) {
    return <EmptyState message={t('userNotFound')} />
  }

  return (
    <FormCard
      title={t('editDialogTitle')}
      description={t('formDescription')}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => navigate('/users')}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="user-email">{t('email')}</Label>
        <div
          id="user-email"
          className="rounded-xl border border-border/80 bg-brand-sand/10 px-3 py-2 text-sm text-foreground"
        >
          {user.email}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-role">{t('role')}</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <select
              id="user-role"
              value={field.value}
              onChange={(event) => field.onChange(event.target.value as AuthRole)}
              className="w-full rounded-xl border border-input bg-white/85 px-3 py-2 text-sm shadow-sm outline-none transition-all duration-200 focus:border-secondary/45 focus:ring-2 focus:ring-brand-sky/18"
            >
              <option value="admin">{t('roleAdmin')}</option>
              <option value="owner">{t('roleOwner')}</option>
              <option value="employee">{t('roleEmployee')}</option>
            </select>
          )}
        />
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>
    </FormCard>
  )
}
