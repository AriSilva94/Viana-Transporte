import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import { Label } from '@renderer/components/ui/label'
import { useToast } from '@renderer/context/ToastContext'
import { formatLocalDate, parseLocalDate } from '../../../shared/date'
import type { Client, Project, ProjectWithClient } from '../../../shared/types'

type FormValues = {
  name: string
  clientId: string
  location: string
  startDate: string
  endDate: string
  status: Project['status']
  contractAmount: string
  description: string
}

export function ProjectFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['projects', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', clientId: '', location: '', startDate: '', endDate: '', status: 'planned', contractAmount: '', description: '' },
  })

  useEffect(() => {
    api.clients.list().then(setClients)
    if (!isEdit) return
    api.projects.get(Number(id)).then((project: ProjectWithClient | null) => {
      if (!project) return
      reset({
        name: project.name,
        clientId: String(project.clientId),
        location: project.location ?? '',
        startDate: project.startDate ? formatLocalDate(project.startDate) : '',
        endDate: project.endDate ? formatLocalDate(project.endDate) : '',
        status: project.status,
        contractAmount: project.contractAmount != null ? String(project.contractAmount) : '',
        description: project.description ?? '',
      })
    })
  }, [id, isEdit, reset])

  async function onSubmit(values: FormValues): Promise<void> {
    setIsLoading(true)
    try {
      const data = {
        name: values.name.trim(),
        clientId: Number(values.clientId),
        location: values.location.trim() || null,
        startDate: values.startDate ? parseLocalDate(values.startDate) : null,
        endDate: values.endDate ? parseLocalDate(values.endDate) : null,
        status: values.status,
        contractAmount: values.contractAmount ? Number(values.contractAmount) : null,
        description: values.description.trim() || null,
      }
      if (isEdit) {
        await api.projects.update(Number(id), data)
      } else {
        await api.projects.create(data)
      }
      showToast(t('projects:form.toasts.success'))
      navigate('/projects')
    } catch {
      showToast(t('projects:form.toasts.error'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('projects:form.editTitle') : t('projects:form.newTitle')}
      description={t('projects:form.description')}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => navigate('/projects')}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="name">{t('projects:form.fields.name')}</Label>
        <Controller
          name="name"
          control={control}
          rules={{ required: t('projects:form.errors.requiredName'), validate: (v) => v.trim() !== '' || t('projects:form.errors.requiredName') }}
          render={({ field }) => (
            <Input id="name" {...field} placeholder={t('projects:form.placeholders.name')} />
          )}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="clientId">{t('projects:form.fields.client')}</Label>
        <Controller
          name="clientId"
          control={control}
          rules={{ required: t('projects:form.errors.requiredClient') }}
          render={({ field }) => (
            <Select id="clientId" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
              <option value="">{t('projects:form.placeholders.client')}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          )}
        />
        {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">{t('projects:form.fields.location')}</Label>
        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <Input id="location" {...field} placeholder={t('projects:form.placeholders.location')} />
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t('projects:form.fields.startDate')}</Label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker id="startDate" value={field.value} onChange={field.onChange} allowClear />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t('projects:form.fields.endDate')}</Label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <DatePicker id="endDate" value={field.value} onChange={field.onChange} allowClear />
            )}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">{t('projects:form.fields.status')}</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select id="status" value={field.value} onChange={(e) => field.onChange(e.target.value as Project['status'])}>
              <option value="planned">{t('common:status.planned')}</option>
              <option value="active">{t('common:status.active')}</option>
              <option value="completed">{t('common:status.completed')}</option>
              <option value="canceled">{t('common:status.canceled')}</option>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractAmount">{t('projects:form.fields.contractAmount')}</Label>
        <Controller
          name="contractAmount"
          control={control}
          render={({ field }) => (
            <Input id="contractAmount" type="number" step="0.01" min="0" {...field} placeholder={t('projects:form.placeholders.contractAmount')} />
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t('projects:form.fields.description')}</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea id="description" {...field} placeholder={t('projects:form.placeholders.description')} />
          )}
        />
      </div>
    </FormCard>
  )
}
