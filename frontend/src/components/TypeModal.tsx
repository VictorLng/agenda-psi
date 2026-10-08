import { useState } from 'react'
import { api } from '../api'
import type { AppointmentType } from '../types'
import Modal, { Field, btnCls, inputCls } from './Modal'

const COLORS = ['#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#64d2ff', '#0a84ff', '#bf5af2', '#ff375f']

export default function TypeModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: AppointmentType) => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[5])
  const [error, setError] = useState('')

  const save = async () => {
    try {
      onCreated(await api.createType({ name: name.trim(), color }))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <Modal title="Novo tipo de atendimento" onClose={onClose}>
      <Field label="Nome">
        <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && save()} />
      </Field>
      <Field label="Cor">
        <div className="flex flex-wrap items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 rounded bg-transparent" />
        </div>
      </Field>
      {error && <p className="mb-3 rounded-xl bg-red-500/30 p-2 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button className={btnCls} onClick={onClose}>Cancelar</button>
        <button className={`${btnCls} bg-white/30 disabled:opacity-40`} disabled={!name.trim()} onClick={save}>Salvar</button>
      </div>
    </Modal>
  )
}
