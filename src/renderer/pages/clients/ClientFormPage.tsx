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
import type { Client } from '../../../shared/types'

type FormValues = {
  name: string
  document: string
  phone: string
  email: string
  notes: string
}

export function ClientFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['clients', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', document: '', phone: '', email: '', notes: '' },
  })

  useEffect(() => {
    if (!isEdit) return
    api.clients.get(Number(id)).then((client: Client | null) => {
      if (!client) return
      reset({
        name: client.name,
        document: client.document ?? '',
        phone: client.phone ?? '',
        email: client.email ?? '',
        notes: client.notes ?? '',
      })
    })
  }, [id, isEdit, reset])

  async function onSubmit(values: FormValues): Promise<void> {
    setIsLoading(true)
    try {
      const data = {
        name: values.name.trim(),
        document: values.document.trim() || null,
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        notes: values.notes.trim() || null,
      }
      if (isEdit) {
        await api.clients.update(Number(id), data)
      } else {
        await api.clients.create(data)
      }
      showToast(t('clients:form.toasts.success'))
      navigate('/clients')
    } catch {
      showToast(t('clients:form.toasts.error'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('clients:form.editTitle') : t('clients:form.newTitle')}
      description={t('clients:form.description')}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => navigate('/clients')}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="name">{t('clients:form.fields.name')}</Label>
        <Controller
          name="name"
          control={control}
          rules={{ required: t('clients:form.errors.requiredName'), validate: (v) => v.trim() !== '' || t('clients:form.errors.requiredName') }}
          render={({ field }) => (
            <Input id="name" {...field} placeholder={t('clients:form.placeholders.name')} />
          )}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="document">{t('clients:form.fields.document')}</Label>
        <Controller
          name="document"
          control={control}
          render={({ field }) => (
            <Input id="document" {...field} placeholder={t('clients:form.placeholders.document')} />
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t('clients:form.fields.phone')}</Label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Input id="phone" {...field} placeholder={t('clients:form.placeholders.phone')} />
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('clients:form.fields.email')}</Label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input id="email" type="email" {...field} placeholder={t('clients:form.placeholders.email')} />
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t('clients:form.fields.notes')}</Label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Textarea id="notes" {...field} placeholder={t('clients:form.placeholders.notes')} />
          )}
        />
      </div>
    </FormCard>
  )
}
