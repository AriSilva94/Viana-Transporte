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
  Machine,
  Operator,
  ProjectCost,
  ProjectCostWithRelations,
  ProjectWithClient,
} from '../../../shared/types'

type CostCategory = ProjectCost['category']

type FormValues = {
  date: string
  projectId: string
  category: CostCategory | ''
  description: string
  amount: string
  machineId: string
  operatorId: string
  notes: string
  dailyLogId: string
}

export function CostFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['costs', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()

  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [projectDailyLogs, setProjectDailyLogs] = useState<DailyLogWithRelations[]>([])

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      date: formatLocalDate(new Date()),
      projectId: '',
      category: '',
      description: '',
      amount: '',
      machineId: '',
      operatorId: '',
      notes: '',
      dailyLogId: '',
    },
  })

  const watchedProjectId = watch('projectId')
  const watchedDailyLogId = watch('dailyLogId')

  const categoryOptions: { value: CostCategory; label: string }[] = [
    { value: 'fuel', label: t('costs:categories.fuel') },
    { value: 'labor', label: t('costs:categories.labor') },
    { value: 'maintenance', label: t('costs:categories.maintenance') },
    { value: 'transport', label: t('costs:categories.transport') },
    { value: 'outsourced', label: t('costs:categories.outsourced') },
    { value: 'miscellaneous', label: t('costs:categories.miscellaneous') },
  ]

  useEffect(() => {
    api.projects.list().then(setProjects)
    api.machines.list().then(setMachines)
    api.operators.list().then(setOperators)

    if (!isEdit) return
    api.costs.get(Number(id)).then((cost: ProjectCostWithRelations | null) => {
      if (!cost) return
      reset({
        date: formatLocalDate(cost.date),
        projectId: String(cost.projectId),
        category: cost.category,
        description: cost.description,
        amount: String(cost.amount),
        machineId: cost.machineId != null ? String(cost.machineId) : '',
        operatorId: cost.operatorId != null ? String(cost.operatorId) : '',
        notes: cost.notes ?? '',
        dailyLogId: cost.dailyLogId != null ? String(cost.dailyLogId) : '',
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
        category: values.category as CostCategory,
        description: values.description.trim(),
        amount: Number(values.amount),
        machineId: values.machineId !== '' ? Number(values.machineId) : null,
        operatorId: values.operatorId !== '' ? Number(values.operatorId) : null,
        dailyLogId: values.dailyLogId !== '' ? Number(values.dailyLogId) : null,
        notes: values.notes.trim() || null,
      }
      if (isEdit) {
        await api.costs.update(Number(id), data)
      } else {
        await api.costs.create(data)
      }
      showToast(t('costs:form.toasts.success'))
      navigate('/costs')
    } catch {
      showToast(t('costs:form.toasts.error'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('costs:form.editTitle') : t('costs:form.newTitle')}
      description={t('costs:form.description')}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => navigate('/costs')}
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">{t('costs:form.fields.date')}</Label>
          <Controller
            name="date"
            control={control}
            rules={{ required: t('costs:form.errors.requiredDate') }}
            render={({ field }) => (
              <DatePicker id="date" value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">{t('costs:form.fields.project')}</Label>
          <Controller
            name="projectId"
            control={control}
            rules={{ required: t('costs:form.errors.requiredProject') }}
            render={({ field }) => (
              <Select id="projectId" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <option value="">{t('costs:form.placeholders.select')}</option>
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
          <Label htmlFor="category">{t('costs:form.fields.category')}</Label>
          <Controller
            name="category"
            control={control}
            rules={{ required: t('costs:form.errors.requiredCategory') }}
            render={({ field }) => (
              <Select id="category" value={field.value} onChange={(e) => field.onChange(e.target.value as CostCategory | '')}>
                <option value="">{t('costs:form.placeholders.select')}</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            )}
          />
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('costs:form.fields.description')}</Label>
          <Controller
            name="description"
            control={control}
            rules={{ required: t('costs:form.errors.requiredDescription'), validate: (v) => v.trim() !== '' || t('costs:form.errors.requiredDescription') }}
            render={({ field }) => (
              <Input id="description" type="text" {...field} placeholder={t('costs:form.placeholders.description')} />
            )}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">{t('costs:form.fields.amount')}</Label>
          <Controller
            name="amount"
            control={control}
            rules={{
              required: t('costs:form.errors.requiredAmount'),
              validate: (v) => (v !== '' && Number(v) > 0) || t('costs:form.errors.requiredAmount'),
            }}
            render={({ field }) => (
              <Input id="amount" type="number" min={0} step={0.01} {...field} placeholder={t('costs:form.placeholders.amount')} />
            )}
          />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="machineId">{t('costs:form.fields.machine')}</Label>
          <Controller
            name="machineId"
            control={control}
            render={({ field }) => (
              <Select id="machineId" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <option value="">{t('costs:form.placeholders.none')}</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
                ))}
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="operatorId">{t('costs:form.fields.operator')}</Label>
          <Controller
            name="operatorId"
            control={control}
            render={({ field }) => (
              <Select id="operatorId" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <option value="">{t('costs:form.placeholders.none')}</option>
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dailyLogId">{t('costs:form.fields.dailyLog')}</Label>
          <Controller
            name="dailyLogId"
            control={control}
            render={({ field }) => (
              <Select id="dailyLogId" value={field.value} onChange={(e) => field.onChange(e.target.value)} disabled={!watchedProjectId}>
                <option value="">{t('costs:form.placeholders.dailyLogNone')}</option>
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
          <Label htmlFor="computedValue">{t('costs:form.fields.computedValue')}</Label>
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
                {t('costs:form.actions.useComputedValue')}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('costs:form.helpers.computedValue')}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('costs:form.fields.notes')}</Label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Textarea id="notes" {...field} placeholder={t('costs:form.placeholders.notes')} />
          )}
        />
      </div>
    </FormCard>
  )
}
