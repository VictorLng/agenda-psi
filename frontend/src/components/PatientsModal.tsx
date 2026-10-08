import { useState } from 'react'
import { api } from '../api'
import type { PatientInput } from '../api'
import { whatsappLink } from '../lib'
import type { Patient } from '../types'
import ClampText from './ClampText'
import Modal, { Field, btnCls, inputCls } from './Modal'

const COLORS = ['#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#64d2ff', '#0a84ff', '#bf5af2', '#ff375f']
const blank: PatientInput = {
  name: '',
  color: COLORS[5],
  description: '',
  phone: '',
  whatsapp_message: 'Olá, {nome}! Passando para lembrar da nossa sessão às {hora}.',
}

interface Props {
  patients: Patient[]
  onClose: () => void
  onChanged: () => void
}

export default function PatientsModal({ patients, onClose, onChanged }: Props) {
  const [editing, setEditing] = useState<{ id?: number; data: PatientInput } | null>(null)
  const [error, setError] = useState('')

  const save = async () => {
    if (!editing) return
    try {
      const d = editing.data
      const body = { ...d, description: d.description || null, phone: d.phone || null, whatsapp_message: d.whatsapp_message || null }
      if (editing.id) await api.updatePatient(editing.id, body)
      else await api.createPatient(body)
      setEditing(null)
      setError('')
      onChanged()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const remove = async (p: Patient) => {
    if (!confirm(`Excluir ${p.name}? Os atendimentos marcados também serão removidos.`)) return
    await api.deletePatient(p.id)
    onChanged()
  }

  if (editing) {
    const set = (patch: Partial<PatientInput>) => setEditing({ ...editing, data: { ...editing.data, ...patch } })
    const d = editing.data
    return (
      <Modal title={editing.id ? 'Editar paciente' : 'Novo paciente'} onClose={() => setEditing(null)}>
        <Field label="Nome">
          <input className={inputCls} value={d.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Cor no calendário">
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                aria-label={c}
                onClick={() => set({ color: c })}
                className={`h-8 w-8 rounded-full border-2 ${d.color === c ? 'border-white' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
            <input type="color" value={d.color} onChange={(e) => set({ color: e.target.value })} className="h-8 w-10 rounded bg-transparent" />
          </div>
        </Field>
        <Field label="Descrição">
          <textarea className={inputCls} rows={3} value={d.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <Field label="Telefone (com DDD)">
          <input className={inputCls} inputMode="tel" placeholder="(11) 91234-5678" value={d.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
        <Field label="Mensagem de WhatsApp — use {nome} e {hora}">
          <textarea className={inputCls} rows={3} value={d.whatsapp_message ?? ''} onChange={(e) => set({ whatsapp_message: e.target.value })} />
        </Field>
        {error && <p className="mb-3 rounded-xl bg-red-500/30 p-2 text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <button className={btnCls} onClick={() => setEditing(null)}>Voltar</button>
          <button className={`${btnCls} bg-white/30 disabled:opacity-40`} disabled={!d.name.trim()} onClick={save}>Salvar</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Pacientes" onClose={onClose} wide>
      <button className={`${btnCls} mb-4 bg-white/30`} onClick={() => setEditing({ data: { ...blank } })}>+ Novo paciente</button>
      {patients.length === 0 && <p className="text-sm text-white/70">Nenhum paciente cadastrado ainda.</p>}
      <ul className="space-y-2">
        {patients.map((p) => {
          const wa = whatsappLink(p)
          return (
            <li key={p.id} className="glass flex items-start gap-3 rounded-2xl p-3">
              <span className="h-10 w-2 rounded-full" style={{ background: p.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="truncate text-xs text-white/70">{p.phone || 'sem telefone'}</p>
                {p.description && <ClampText text={p.description} className="mt-1 text-xs text-white/85" />}
              </div>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className={`${btnCls} bg-emerald-400/30`}>WhatsApp</a>}
              <button className={btnCls} onClick={() => setEditing({ id: p.id, data: { name: p.name, color: p.color, description: p.description, phone: p.phone, whatsapp_message: p.whatsapp_message } })}>Editar</button>
              <button className={`${btnCls} bg-red-500/30`} onClick={() => remove(p)}>Excluir</button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
