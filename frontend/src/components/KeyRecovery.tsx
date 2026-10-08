import { useState } from 'react'
import { api } from '../api'
import { saveLocalKey, unwrapDataKey } from '../crypto'
import { btnCls, inputCls } from './Modal'

/** Restaura a chave de dados neste navegador a partir da chave de recuperação. */
export default function KeyRecovery({ onRecovered }: { onRecovered: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const recover = async () => {
    setBusy(true)
    setError('')
    try {
      const b = await api.keyBackup()
      if (!b.exists || !b.wrapped_key || !b.iv) throw new Error('Não há backup de chave no servidor.')
      saveLocalKey(await unwrapDataKey(b.wrapped_key, b.iv, value))
      onRecovered()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="mb-3 rounded-2xl bg-white/10 p-3">
      <p className="mb-2 text-sm">Este navegador não tem a chave dos resumos. Cole sua <b>chave de recuperação</b>:</p>
      <input
        className={`${inputCls} font-mono text-xs`}
        placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {error && <p className="mt-2 rounded-xl bg-red-500/30 p-2 text-sm">{error}</p>}
      <button className={`${btnCls} mt-2 bg-white/30 disabled:opacity-40`} disabled={busy || value.trim().length < 20} onClick={recover}>
        Recuperar chave
      </button>
    </div>
  )
}
