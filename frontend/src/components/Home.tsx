import { useState } from 'react'
import { api } from '../api'
import type { Settings } from '../types'
import Modal, { Field, btnCls, inputCls } from './Modal'

const PRESETS: { name: string; c: [string, string, string] }[] = [
  { name: 'Aurora', c: ['#6d83f2', '#b36bd9', '#f78fb3'] },
  { name: 'Oceano', c: ['#0f2027', '#2c7a9b', '#6dd5ed'] },
  { name: 'Pôr do sol', c: ['#ff9966', '#ff5e62', '#b24592'] },
  { name: 'Floresta', c: ['#134e5e', '#3a9a6e', '#a8e063'] },
  { name: 'Lavanda', c: ['#a18cd1', '#c7a8e8', '#fbc2eb'] },
  { name: 'Grafite', c: ['#232526', '#414345', '#6b6e73'] },
]

interface Props {
  settings: Settings
  onSettings: (s: Settings) => void
  onOpenCalendar: () => void
  onOpenPatients: () => void
  onOpenNotes: () => void
  onTestAlert: () => Promise<string>
}

export default function Home({ settings, onSettings, onOpenCalendar, onOpenPatients, onOpenNotes, onTestAlert }: Props) {
  const [open, setOpen] = useState(false)
  const [testMsg, setTestMsg] = useState('')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <p className="rise text-lg text-white/85">Olá, {settings.owner_name}</p>
      <button
        onClick={onOpenCalendar}
        className="glass rise w-full max-w-xl rounded-3xl px-8 py-10 text-center text-3xl font-semibold tracking-tight transition hover:scale-[1.02] active:scale-[0.99]"
      >
        Calendário de Atendimentos
        <span className="mt-1 block text-sm font-normal text-white/70">Segunda a sábado · de hora em hora</span>
      </button>
      <div className="rise flex gap-3">
        <button onClick={onOpenPatients} className={btnCls}>Pacientes</button>
        <button onClick={onOpenNotes} className={btnCls}>Resumos</button>
        <button onClick={() => setOpen(true)} className={btnCls}>Personalizar fundo</button>
      </div>
      <div className="rise flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/40 px-4 py-3">
        <span className="text-xs uppercase tracking-wide text-white/70">Debug</span>
        <button onClick={async () => setTestMsg(await onTestAlert())} className={btnCls}>🔔 Tocar notificação agora</button>
        {testMsg && <p className="max-w-xs text-center text-xs text-white/85">{testMsg}</p>}
      </div>
      {open && <BackgroundModal settings={settings} onSettings={onSettings} onClose={() => setOpen(false)} />}
    </div>
  )
}

function BackgroundModal({ settings, onSettings, onClose }: { settings: Settings; onSettings: (s: Settings) => void; onClose: () => void }) {
  const [s, setS] = useState(settings)
  const [name, setName] = useState(settings.owner_name)

  const apply = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch }
    setS(next)
    onSettings({ ...next, owner_name: settings.owner_name })
  }
  const cancel = () => {
    onSettings(settings)
    onClose()
  }
  const save = async () => {
    const saved = await api.saveSettings({ ...s, owner_name: name.trim() || settings.owner_name })
    onSettings(saved)
    onClose()
  }

  return (
    <Modal title="Personalizar" onClose={cancel}>
      <Field label="Seu nome">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <p className="mb-2 text-sm font-medium text-white/85">Temas</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => apply({ bg_from: p.c[0], bg_via: p.c[1], bg_to: p.c[2] })}
            className="h-16 rounded-2xl border border-white/40 text-xs font-semibold drop-shadow"
            style={{ background: `linear-gradient(135deg, ${p.c.join(',')})` }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="mb-5 grid grid-cols-3 gap-3 text-xs">
        {(['bg_from', 'bg_via', 'bg_to'] as const).map((k, i) => (
          <label key={k} className="flex flex-col items-center gap-1">
            {['Início', 'Meio', 'Fim'][i]}
            <input
              type="color"
              value={s[k]}
              onChange={(e) => apply({ [k]: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-lg border border-white/40 bg-transparent"
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button className={btnCls} onClick={cancel}>Cancelar</button>
        <button className={`${btnCls} bg-white/30`} onClick={save}>Salvar</button>
      </div>
    </Modal>
  )
}
