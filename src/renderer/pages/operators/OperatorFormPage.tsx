import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import { useToast } from '@renderer/context/ToastContext'
import type { Operator } from '../../../shared/types'

type FormValues = {
  name: string
  phone: string
  role: string
  isActive: boolean
  notes: string
}

export function OperatorFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['operators', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', phone: '', role: '', isActive: true, notes: '' },
  })

  useEffect(() => {
    if (!isEdit) return
    api.operators.get(Number(id)).then((operator: Operator | null) => {
      if (!operator) return
      reset({
        name: operator.name,
        phone: operator.phone ?? '',
        role: operator.role ?? '',
        isActive: operator.isActive,
        notes: operator.notes ?? '',
      })
    })
  }, [id, isEdit, reset])

  async function onSubmit(values: FormValues): Promise<void> {
    setIsLoading(true)
    try {
      const data = {
        name: values.name.trim(),
        phone: values.phone.trim() || null,
        role: values.role.trim() || null,
        isActive: values.isActive,
        notes: values.notes.trim() || null,
      }
      if (isEdit) {
        await api.operators.update(Number(id), data)
      } else {
        await api.operators.create(data)
      }
      showToast(t('operators:form.toasts.success'))
      navigate('/operators')
    } catch {
      showToast(t('operators:form.toasts.error'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('operators:form.editTitle') : t('operators:form.newTitle')}
      description={t('operators:form.description')}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => navigate('/operators')}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="name">{t('operators:form.fields.name')}</Label>
        <Controller
          name="name"
          control={control}
          rules={{ required: t('operators:form.errors.requiredName'), validate: (v) => v.trim() !== '' || t('operators:form.errors.requiredName') }}
          render={({ field }) => (
            <Input id="name" {...field} placeholder={t('operators:form.placeholders.name')} />
          )}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t('operators:form.fields.phone')}</Label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Input id="phone" {...field} placeholder={t('operators:form.placeholders.phone')} />
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">{t('operators:form.fields.role')}</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Input id="role" {...field} placeholder={t('operators:form.placeholders.role')} />
          )}
        />
      </div>
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-brand-sand/12 px-4 py-3">
            <input
              id="isActive"
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <Label htmlFor="isActive">{t('operators:form.fields.isActive')}</Label>
          </div>
        )}
      />
      <div className="space-y-2">
        <Label htmlFor="notes">{t('operators:form.fields.notes')}</Label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Textarea id="notes" {...field} placeholder={t('operators:form.placeholders.notes')} />
          )}
        />
      </div>
    </FormCard>
  )
}
