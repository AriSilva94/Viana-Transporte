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
import { Button } from '@renderer/components/ui/button'
import { useToast } from '@renderer/context/ToastContext'
import { formatLocalDate, parseLocalDate } from '../../../shared/date'
import { computeDailyLogValue } from '../../../shared/dailyLogValue'
import type {
  DailyLogWithRelations,
  ProjectRevenue,
  ProjectRevenueWithRelations,
  ProjectWithClient,
} from '../../../shared/types'

type RevenueStatus = ProjectRevenue['status']

type FormValues = {
  date: string
  projectId: string
  description: string
  amount: string
  status: RevenueStatus
  notes: string
  dailyLogId: string
}

export function RevenueFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['revenues', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()

  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [projectDailyLogs, setProjectDailyLogs] = useState<DailyLogWithRelations[]>([])

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      date: formatLocalDate(new Date()),
      projectId: '',
      description: '',
      amount: '',
      status: 'planned',
      notes: '',
      dailyLogId: '',
    },
  })

  const watchedProjectId = watch('projectId')
  const watchedDailyLogId = watch('dailyLogId')

  const statusOptions: { value: RevenueStatus; label: string }[] = [
    { value: 'planned', label: t('revenues:statuses.planned') },
    { value: 'billed', label: t('revenues:statuses.billed') },
    { value: 'received', label: t('revenues:statuses.received') },
  ]

  useEffect(() => {
    api.projects.list().then(setProjects)
    if (!isEdit) return
    api.revenues.get(Number(id)).then((revenue: ProjectRevenueWithRelations | null) => {
      if (!revenue) return
      reset({
        date: formatLocalDate(revenue.date),
        projectId: String(revenue.projectId),
        description: revenue.description,
        amount: String(revenue.amount),
        status: revenue.status,
        notes: revenue.notes ?? '',
        dailyLogId: revenue.dailyLogId != null ? String(revenue.dailyLogId) : '',
      })
    })
  }, [id, isEdit, reset])

  useEffect(() => {
    if (!watchedProjectId) {
      setProjectDailyLogs([])
      return
    }
    api.dailylogs.list({ projectId: Number(watchedProjectId) }).then(setProjectDailyLogs)
  }, [watchedProjectId])

  const selectedDailyLog =
    watchedDailyLogId === ''
      ? null
      : projectDailyLogs.find((log) => log.id === Number(watchedDailyLogId)) ?? null

  const computedValue = selectedDailyLog
    ? computeDailyLogValue({
        tonnage: selectedDailyLog.tonnage,
        percentage: selectedDailyLog.percentage,
        km: selectedDailyLog.km,
        toll: selectedDailyLog.toll,
      })
    : 0
  const computedValueFormatted = computedValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  async function onSubmit(values: FormValues): Promise<void> {
    setIsLoading(true)
    try {
      const data = {
        date: parseLocalDate(values.date),
        projectId: Number(values.projectId),
        description: values.description.trim(),
        amount: Number(values.amount),
        status: values.status,
        notes: values.notes.trim() || null,
        dailyLogId: values.dailyLogId !== '' ? Number(values.dailyLogId) : null,
      }
      if (isEdit) {
        await api.revenues.update(Number(id), data)
      } else {
        await api.revenues.create(data)
      }
      showToast(t('revenues:form.toasts.success'))
      navigate('/revenues')
    } catch {
      showToast(t('revenues:form.toasts.error'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('revenues:form.editTitle') : t('revenues:form.newTitle')}
      description={t('revenues:form.description')}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => navigate('/revenues')}
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">{t('revenues:form.fields.date')}</Label>
          <Controller
            name="date"
            control={control}
            rules={{ required: t('revenues:form.errors.requiredDate') }}
            render={({ field }) => (
              <DatePicker id="date" value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">{t('revenues:form.fields.project')}</Label>
          <Controller
            name="projectId"
            control={control}
            rules={{ required: t('revenues:form.errors.requiredProject') }}
            render={({ field }) => (
              <Select id="projectId" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <option value="">{t('revenues:form.placeholders.select')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.clientName ?? t('common:emptyValue')}
                  </option>
                ))}
              </Select>
            )}
          />
          {errors.projectId && <p className="text-sm text-destructive">{errors.projectId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description">{t('revenues:form.fields.description')}</Label>
          <Controller
            name="description"
            control={control}
            rules={{ required: t('revenues:form.errors.requiredDescription'), validate: (v) => v.trim() !== '' || t('revenues:form.errors.requiredDescription') }}
            render={({ field }) => (
              <Input id="description" type="text" {...field} placeholder={t('revenues:form.placeholders.description')} />
            )}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">{t('revenues:form.fields.amount')}</Label>
          <Controller
            name="amount"
            control={control}
            rules={{
              required: t('revenues:form.errors.requiredAmount'),
              validate: (v) => (v !== '' && Number(v) > 0) || t('revenues:form.errors.requiredAmount'),
            }}
            render={({ field }) => (
              <Input id="amount" type="number" min={0} step={0.01} {...field} placeholder={t('revenues:form.placeholders.amount')} />
            )}
          />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">{t('revenues:form.fields.status')}</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select id="status" value={field.value} onChange={(e) => field.onChange(e.target.value as RevenueStatus)}>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dailyLogId">{t('revenues:form.fields.dailyLog')}</Label>
          <Controller
            name="dailyLogId"
            control={control}
            render={({ field }) => (
              <Select id="dailyLogId" value={field.value} onChange={(e) => field.onChange(e.target.value)} disabled={!watchedProjectId}>
                <option value="">{t('revenues:form.placeholders.dailyLogNone')}</option>
                {projectDailyLogs.map((log) => (
                  <option key={log.id} value={log.id}>
                    {formatLocalDate(log.date)} — {log.workDescription ?? t('common:emptyValue')}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="computedValue">{t('revenues:form.fields.computedValue')}</Label>
          <div className="flex gap-2">
            <Input
              id="computedValue"
              type="text"
              value={computedValueFormatted}
              readOnly
              tabIndex={-1}
              className="bg-muted/40 font-medium text-brand-ink"
            />
            {selectedDailyLog && computedValue > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setValue('amount', String(computedValue))}
              >
                {t('revenues:form.actions.useComputedValue')}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('revenues:form.helpers.computedValue')}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('revenues:form.fields.notes')}</Label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Textarea id="notes" {...field} placeholder={t('revenues:form.placeholders.notes')} />
          )}
        />
      </div>
    </FormCard>
  )
}
