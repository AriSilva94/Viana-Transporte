import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import { useToast } from '@renderer/context/ToastContext'
import type { Client } from '../../../shared/types'

export function ClientFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['clients', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    api.clients.get(Number(id)).then((client: Client | null) => {
      if (!client) return
      setName(client.name)
      setDocument(client.document ?? '')
      setPhone(client.phone ?? '')
      setEmail(client.email ?? '')
      setNotes(client.notes ?? '')
    })
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('clients:form.errors.requiredName'))
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        name: name.trim(),
        document: document.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
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
      setError(t('clients:form.errors.save'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('clients:form.editTitle') : t('clients:form.newTitle')}
      description={t('clients:form.description')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/clients')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">{t('clients:form.fields.name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('clients:form.placeholders.name')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="document">{t('clients:form.fields.document')}</Label>
        <Input
          id="document"
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          placeholder={t('clients:form.placeholders.document')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t('clients:form.fields.phone')}</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('clients:form.placeholders.phone')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('clients:form.fields.email')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('clients:form.placeholders.email')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t('clients:form.fields.notes')}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('clients:form.placeholders.notes')}
        />
      </div>
    </FormCard>
  )
}
