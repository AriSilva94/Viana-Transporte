import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import type { Client } from '../../../shared/types'

export function ClientFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined

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
      setError('Nome é obrigatório')
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
      navigate('/clients')
    } catch {
      setError('Erro ao salvar cliente. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? 'Editar Cliente' : 'Novo Cliente'}
      description="Cadastre ou atualize as informações de contato para manter o relacionamento comercial organizado."
      onSubmit={handleSubmit}
      onCancel={() => navigate('/clients')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do cliente"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="document">Documento</Label>
        <Input
          id="document"
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          placeholder="CPF / CNPJ"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(00) 00000-0000"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações..."
        />
      </div>
    </FormCard>
  )
}
