import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import { Label } from '@renderer/components/ui/label'
import type { Client, Project, ProjectWithClient } from '../../../shared/types'

export function ProjectFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined

  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<Project['status']>('planned')
  const [contractAmount, setContractAmount] = useState('')
  const [description, setDescription] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.clients.list().then(setClients)
    if (!isEdit) return
    api.projects.get(Number(id)).then((project: ProjectWithClient | null) => {
      if (!project) return
      setName(project.name)
      setClientId(String(project.clientId))
      setLocation(project.location ?? '')
      setStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '')
      setEndDate(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '')
      setStatus(project.status)
      setContractAmount(project.contractAmount != null ? String(project.contractAmount) : '')
      setDescription(project.description ?? '')
    })
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    if (!clientId) { setError('Cliente é obrigatório'); return }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        name: name.trim(),
        clientId: Number(clientId),
        location: location.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status,
        contractAmount: contractAmount ? Number(contractAmount) : null,
        description: description.trim() || null,
      }
      if (isEdit) {
        await api.projects.update(Number(id), data)
      } else {
        await api.projects.create(data)
      }
      navigate('/projects')
    } catch {
      setError('Erro ao salvar projeto. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? 'Editar Projeto' : 'Novo Projeto'}
      description="Defina o contexto da obra, cliente, status e valores para acompanhar o projeto com clareza."
      onSubmit={handleSubmit}
      onCancel={() => navigate('/projects')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do projeto" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="clientId">Cliente *</Label>
        <Select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Selecione um cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Localização</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Local da obra" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data Início</Label>
          <DatePicker id="startDate" value={startDate} onChange={setStartDate} allowClear />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Data Fim</Label>
          <DatePicker id="endDate" value={endDate} onChange={setEndDate} allowClear />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as Project['status'])}>
          <option value="planned">Planejado</option>
          <option value="active">Ativo</option>
          <option value="completed">Concluído</option>
          <option value="canceled">Cancelado</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractAmount">Valor Contratado</Label>
        <Input id="contractAmount" type="number" step="0.01" min="0" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} placeholder="0,00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o projeto..." />
      </div>
    </FormCard>
  )
}
