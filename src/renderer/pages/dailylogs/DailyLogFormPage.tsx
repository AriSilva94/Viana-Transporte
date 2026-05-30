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
import { computeDailyLogValue } from '../../../shared/dailyLogValue'
import type { DailyLogWithRelations, Machine, Operator, ProjectWithClient } from '../../../shared/types'

type FormValues = {
  date: string
  projectId: string
  machineId: string
  operatorId: string
  hoursWorked: string
  workDescription: string
  fuelQuantity: string
  downtimeNotes: string
  notes: string
  km: string
  percentage: string
  toll: string
  tonnage: string
}

const countDecimals = (v: string): number => {
  const dot = v.indexOf('.')
  return dot === -1 ? 0 : v.length - dot - 1
}

export function DailyLogFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['dailylogs', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()

  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      date: formatLocalDate(new Date()),
      projectId: '',
      machineId: '',
      operatorId: '',
      hoursWorked: '',
      workDescription: '',
      fuelQuantity: '',
      downtimeNotes: '',
      notes: '',
      km: '',
      percentage: '',
      toll: '',
      tonnage: '',
    },
  })

  const [tonnage, km, percentage, toll] = watch(['tonnage', 'km', 'percentage', 'toll'])

  const computedValue = computeDailyLogValue({
    tonnage: tonnage === '' ? null : Number(tonnage),
    percentage: percentage === '' ? null : Number(percentage),
    km: km === '' ? null : Number(km),
    toll: toll === '' ? null : Number(toll),
  })
  const computedValueFormatted = computedValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  useEffect(() => {
    api.projects.list().then(setProjects)
    api.machines.list().then(setMachines)
    api.operators.list().then(setOperators)

    if (!isEdit) return
    api.dailylogs.get(Number(id)).then((log: DailyLogWithRelations | null) => {
      if (!log) return
      reset({
        date: formatLocalDate(log.date),
        projectId: String(log.projectId),
        machineId: log.machineId != null ? String(log.machineId) : '',
        operatorId: log.operatorId != null ? String(log.operatorId) : '',
        hoursWorked: log.hoursWorked != null ? String(log.hoursWorked) : '',
        workDescription: log.workDescription ?? '',
        fuelQuantity: log.fuelQuantity != null ? String(log.fuelQuantity) : '',
        downtimeNotes: log.downtimeNotes ?? '',
        notes: log.notes ?? '',
        km: log.km != null ? String(log.km) : '',
        percentage: log.percentage != null ? String(log.percentage) : '',
        toll: log.toll != null ? String(log.toll) : '',
        tonnage: log.tonnage != null ? String(log.tonnage) : '',
      })
    })
  }, [id, isEdit, reset])

  async function onSubmit(values: FormValues): Promise<void> {
    setIsLoading(true)
    try {
      const data = {
        date: parseLocalDate(values.date),
        projectId: Number(values.projectId),
        machineId: values.machineId !== '' ? Number(values.machineId) : null,
        operatorId: values.operatorId !== '' ? Number(values.operatorId) : null,
        hoursWorked: Number(values.hoursWorked),
        workDescription: values.workDescription.trim() || null,
        fuelQuantity: values.fuelQuantity !== '' ? Number(values.fuelQuantity) : null,
        downtimeNotes: values.downtimeNotes.trim() || null,
        notes: values.notes.trim() || null,
        km: values.km !== '' ? Number(values.km) : null,
        percentage: values.percentage !== '' ? Number(values.percentage) : null,
        toll: values.toll !== '' ? Number(values.toll) : null,
        tonnage: values.tonnage !== '' ? Number(values.tonnage) : null,
      }
      if (isEdit) {
        await api.dailylogs.update(Number(id), data)
      } else {
        await api.dailylogs.create(data)
      }
      showToast(t('dailylogs:form.toasts.success'))
      navigate('/daily-logs')
    } catch {
      showToast(t('dailylogs:form.toasts.error'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('dailylogs:form.editTitle') : t('dailylogs:form.newTitle')}
      description={t('dailylogs:form.description')}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => navigate('/daily-logs')}
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">{t('dailylogs:form.fields.date')}</Label>
          <Controller
            name="date"
            control={control}
            rules={{ required: t('dailylogs:form.errors.requiredDate') }}
            render={({ field }) => (
              <DatePicker id="date" value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">{t('dailylogs:form.fields.project')}</Label>
          <Controller
            name="projectId"
            control={control}
            rules={{ required: t('dailylogs:form.errors.requiredProject') }}
            render={({ field }) => (
              <Select id="projectId" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <option value="">{t('dailylogs:form.placeholders.select')}</option>
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
          <Label htmlFor="machineId">{t('dailylogs:form.fields.machine')}</Label>
          <Controller
            name="machineId"
            control={control}
            render={({ field }) => (
              <Select id="machineId" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <option value="">{t('dailylogs:form.placeholders.none')}</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
                ))}
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="operatorId">{t('dailylogs:form.fields.operator')}</Label>
          <Controller
            name="operatorId"
            control={control}
            render={({ field }) => (
              <Select id="operatorId" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <option value="">{t('dailylogs:form.placeholders.none')}</option>
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
          <Label htmlFor="hoursWorked">{t('dailylogs:form.fields.hoursWorked')}</Label>
          <Controller
            name="hoursWorked"
            control={control}
            rules={{
              required: t('dailylogs:form.errors.requiredHours'),
              validate: (v) => (v !== '' && Number(v) > 0) || t('dailylogs:form.errors.requiredHours'),
            }}
            render={({ field }) => (
              <Input id="hoursWorked" type="number" min={0} step={0.5} {...field} placeholder={t('dailylogs:form.placeholders.hoursWorked')} />
            )}
          />
          {errors.hoursWorked && <p className="text-sm text-destructive">{errors.hoursWorked.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuelQuantity">{t('dailylogs:form.fields.fuelQuantity')}</Label>
          <Controller
            name="fuelQuantity"
            control={control}
            rules={{
              validate: (v) => {
                if (v === '') return true
                if (Number(v) < 0) return t('dailylogs:form.errors.negativeNotAllowed')
                if (countDecimals(v) > 2) return t('dailylogs:form.errors.fuelQuantityPrecision')
                return true
              },
            }}
            render={({ field }) => (
              <Input id="fuelQuantity" type="number" min={0} step={0.01} {...field} placeholder={t('dailylogs:form.placeholders.fuelQuantity')} />
            )}
          />
          {errors.fuelQuantity && <p className="text-sm text-destructive">{errors.fuelQuantity.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="km">{t('dailylogs:form.fields.km')}</Label>
          <Controller
            name="km"
            control={control}
            rules={{
              validate: (v) => {
                if (v === '') return true
                if (Number(v) < 0) return t('dailylogs:form.errors.negativeNotAllowed')
                if (countDecimals(v) > 2) return t('dailylogs:form.errors.kmPrecision')
                return true
              },
            }}
            render={({ field }) => (
              <Input id="km" type="number" min={0} step={0.01} {...field} placeholder={t('dailylogs:form.placeholders.km')} />
            )}
          />
          {errors.km && <p className="text-sm text-destructive">{errors.km.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="percentage">{t('dailylogs:form.fields.percentage')}</Label>
          <Controller
            name="percentage"
            control={control}
            rules={{
              validate: (v) => {
                if (v === '') return true
                if (Number(v) < 0) return t('dailylogs:form.errors.negativeNotAllowed')
                if (countDecimals(v) > 2) return t('dailylogs:form.errors.percentagePrecision')
                return true
              },
            }}
            render={({ field }) => (
              <Input id="percentage" type="number" min={0} step={0.01} {...field} placeholder={t('dailylogs:form.placeholders.percentage')} />
            )}
          />
          {errors.percentage && <p className="text-sm text-destructive">{errors.percentage.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="toll">{t('dailylogs:form.fields.toll')}</Label>
          <Controller
            name="toll"
            control={control}
            rules={{
              validate: (v) => {
                if (v === '') return true
                if (Number(v) < 0) return t('dailylogs:form.errors.negativeNotAllowed')
                if (countDecimals(v) > 2) return t('dailylogs:form.errors.tollPrecision')
                return true
              },
            }}
            render={({ field }) => (
              <Input id="toll" type="number" min={0} step={0.01} {...field} placeholder={t('dailylogs:form.placeholders.toll')} />
            )}
          />
          {errors.toll && <p className="text-sm text-destructive">{errors.toll.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tonnage">{t('dailylogs:form.fields.tonnage')}</Label>
          <Controller
            name="tonnage"
            control={control}
            rules={{
              validate: (v) => {
                if (v === '') return true
                if (Number(v) < 0) return t('dailylogs:form.errors.negativeNotAllowed')
                if (countDecimals(v) > 4) return t('dailylogs:form.errors.tonnagePrecision')
                return true
              },
            }}
            render={({ field }) => (
              <Input id="tonnage" type="number" min={0} step={0.0001} {...field} placeholder={t('dailylogs:form.placeholders.tonnage')} />
            )}
          />
          {errors.tonnage && <p className="text-sm text-destructive">{errors.tonnage.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="computedValue">{t('dailylogs:form.fields.computedValue')}</Label>
        <Input
          id="computedValue"
          type="text"
          value={computedValueFormatted}
          readOnly
          tabIndex={-1}
          className="bg-muted/40 font-medium text-brand-ink"
        />
        <p className="text-xs text-muted-foreground">
          {t('dailylogs:form.helpers.computedValue')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workDescription">{t('dailylogs:form.fields.workDescription')}</Label>
        <Controller
          name="workDescription"
          control={control}
          render={({ field }) => (
            <Textarea id="workDescription" {...field} placeholder={t('dailylogs:form.placeholders.workDescription')} />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="downtimeNotes">{t('dailylogs:form.fields.downtimeNotes')}</Label>
          <Controller
            name="downtimeNotes"
            control={control}
            render={({ field }) => (
              <Textarea id="downtimeNotes" {...field} placeholder={t('dailylogs:form.placeholders.downtimeNotes')} />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">{t('dailylogs:form.fields.notes')}</Label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea id="notes" {...field} placeholder={t('dailylogs:form.placeholders.notes')} />
            )}
          />
        </div>
      </div>
    </FormCard>
  )
}
