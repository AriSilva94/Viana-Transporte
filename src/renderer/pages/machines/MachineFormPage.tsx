import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select } from '@renderer/components/ui/select'
import { Label } from '@renderer/components/ui/label'
import { useToast } from '@renderer/context/ToastContext'
import type { Machine } from '../../../shared/types'

type FormValues = {
  name: string
  type: string
  identifier: string
  brandModel: string
  status: Machine['status']
  notes: string
}

export function MachineFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['machines', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', type: '', identifier: '', brandModel: '', status: 'available', notes: '' },
  })

  useEffect(() => {
    if (!isEdit) return
    api.machines.get(Number(id)).then((machine: Machine | null) => {
      if (!machine) return
      reset({
        name: machine.name,
        type: machine.type,
        identifier: machine.identifier ?? '',
        brandModel: machine.brandModel ?? '',
        status: machine.status,
        notes: machine.notes ?? '',
      })
    })
  }, [id, isEdit, reset])

  async function onSubmit(values: FormValues): Promise<void> {
    setIsLoading(true)
    try {
      const data = {
        name: values.name.trim(),
        type: values.type.trim(),
        identifier: values.identifier.trim() || null,
        brandModel: values.brandModel.trim() || null,
        status: values.status,
        notes: values.notes.trim() || null,
      }
      if (isEdit) {
        await api.machines.update(Number(id), data)
      } else {
        await api.machines.create(data)
      }
      showToast(t('machines:form.toasts.success'))
      navigate('/machines')
    } catch {
      showToast(t('machines:form.toasts.error'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('machines:form.editTitle') : t('machines:form.newTitle')}
      description={t('machines:form.description')}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => navigate('/machines')}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="name">{t('machines:form.fields.name')}</Label>
        <Controller
          name="name"
          control={control}
          rules={{ required: t('machines:form.errors.requiredName'), validate: (v) => v.trim() !== '' || t('machines:form.errors.requiredName') }}
          render={({ field }) => (
            <Input id="name" {...field} placeholder={t('machines:form.placeholders.name')} />
          )}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">{t('machines:form.fields.type')}</Label>
        <Controller
          name="type"
          control={control}
          rules={{ required: t('machines:form.errors.requiredType'), validate: (v) => v.trim() !== '' || t('machines:form.errors.requiredType') }}
          render={({ field }) => (
            <Input id="type" {...field} placeholder={t('machines:form.placeholders.type')} />
          )}
        />
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="identifier">{t('machines:form.fields.identifier')}</Label>
        <Controller
          name="identifier"
          control={control}
          render={({ field }) => (
            <Input id="identifier" {...field} placeholder={t('machines:form.placeholders.identifier')} />
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brandModel">{t('machines:form.fields.brandModel')}</Label>
        <Controller
          name="brandModel"
          control={control}
          render={({ field }) => (
            <Input id="brandModel" {...field} placeholder={t('machines:form.placeholders.brandModel')} />
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">{t('machines:form.fields.status')}</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select id="status" value={field.value} onChange={(e) => field.onChange(e.target.value as Machine['status'])}>
              <option value="available">{t('common:status.available')}</option>
              <option value="allocated">{t('common:status.allocated')}</option>
              <option value="under_maintenance">{t('common:status.under_maintenance')}</option>
              <option value="inactive">{t('common:status.inactive')}</option>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t('machines:form.fields.notes')}</Label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Textarea id="notes" {...field} placeholder={t('machines:form.placeholders.notes')} />
          )}
        />
      </div>
    </FormCard>
  )
}
