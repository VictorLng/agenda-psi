import { useState } from 'react'
import { btnCls, inputCls } from './Modal'

interface Props {
  name: string
  onEnter: (name: string) => void
}

export default function Splash({ name, onEnter }: Props) {
  const [value, setValue] = useState(name)
  const [leaving, setLeaving] = useState(false)
  const [editing, setEditing] = useState(!name)
  const ready = value.trim().length > 0

  const go = () => {
    if (!ready || leaving) return
    setLeaving(true)
    setTimeout(() => onEnter(value.trim()), 350)
  }

  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-8 px-6 text-center transition-all duration-300 ${leaving ? 'scale-105 opacity-0' : ''}`}
    >
      <h1 className="rise text-6xl font-semibold tracking-tight drop-shadow-lg sm:text-7xl">
        Olá{name ? `, ${name}` : ''}
      </h1>
      {editing && (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          placeholder="Como devo te chamar?"
          className={`${inputCls} rise max-w-xs text-center`}
        />
      )}
      <button
        onClick={go}
        disabled={!ready}
        className={`${btnCls} rise px-8 py-3 text-lg disabled:opacity-40`}
      >
        Entrar
      </button>
      {!editing && (
        <button onClick={() => setEditing(true)} className="-mt-4 text-sm text-white/75 underline underline-offset-4 hover:text-white">
          Não é {name}? Trocar nome
        </button>
      )}
      <p className="max-w-xs text-xs text-white/70">
        Ao entrar, o navegador pedirá permissão para avisos e sons dos horários.
      </p>
    </div>
  )
}
