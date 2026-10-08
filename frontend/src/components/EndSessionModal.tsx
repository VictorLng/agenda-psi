import { useEffect, useState } from 'react'
import { api } from '../api'
import { encryptText, hasLocalKey, newDataKey, newRecoveryKey, saveLocalKey, wrapDataKey } from '../crypto'
import type { ActiveSession } from '../types'
import KeyRecovery from './KeyRecovery'
import Modal, { Field, btnCls, inputCls } from './Modal'

type KeyState = 'loading' | 'ready' | 'create' | 'recover' | 'show-recovery'

interface Props {
  session: ActiveSession
  onClose: () => void // volta para a sessão em andamento
  onDone: () => void // encerra a sessão
}

export default function EndSessionModal({ session, onClose, onDone }: Props) {
  const [text, setText] = useState('')
  const [keyState, setKeyState] = useState<KeyState>('loading')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (hasLocalKey()) return setKeyState('ready')
    api.keyBackup()
      .then((b) => setKeyState(b.exists ? 'recover' : 'create'))
      .catch((e: Error) => setError(e.message))
  }, [])

  const guard = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  const persist = async () => {
    const enc = await encryptText(text.trim())
    await api.createNote({
      patient_id: session.patientId,
      session_date: session.date,
      hour: session.hour,
      started_at: session.startedAt,
      ended_at: new Date().toISOString(),
      ...enc,
    })
    onDone()
  }

  // Primeira vez: gera a chave, grava o backup (cifrado) no servidor e só então guarda local.
  const createKey = () =>
    guard(async () => {
      const dek = newDataKey()
      const rk = newRecoveryKey()
      await api.saveKeyBackup(await wrapDataKey(dek, rk))
      saveLocalKey(dek)
      setRecoveryKey(rk)
      setKeyState('show-recovery')
    })

  const download = () => {
    const blob = new Blob([`Chave de recuperação dos resumos de sessão\n\n${recoveryKey}\n\nGuarde em local seguro. Sem ela não é possível recuperar os resumos em outro navegador.\n`], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'chave-de-recuperacao.txt'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (keyState === 'show-recovery') {
    return (
      <Modal title="Guarde sua chave de recuperação" onClose={() => {}}>
        <p className="mb-3 text-sm text-white/85">
          Seus resumos são cifrados neste navegador. Esta chave é a <b>única</b> forma de abri-los em outro
          computador ou se os dados do navegador forem apagados. Ela <b>não fica salva em lugar nenhum</b> e
          não será mostrada de novo.
        </p>
        <p className="mb-3 select-all break-all rounded-xl bg-black/30 p-3 font-mono text-sm">{recoveryKey}</p>
        <div className="mb-3 flex gap-2">
          <button className={btnCls} onClick={() => navigator.clipboard?.writeText(recoveryKey)}>Copiar</button>
          <button className={btnCls} onClick={download}>Baixar .txt</button>
        </div>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
          Guardei a chave em um lugar seguro
        </label>
        {error && <p className="mb-3 rounded-xl bg-red-500/30 p-2 text-sm">{error}</p>}
        <div className="flex justify-end">
          <button className={`${btnCls} bg-white/30 disabled:opacity-40`} disabled={!saved || busy} onClick={() => guard(persist)}>
            Continuar e salvar resumo
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Finalizar sessão" onClose={onClose} wide>
      <p className="mb-3 text-sm text-white/80">
        {session.patientName} · {session.date.split('-').reverse().join('/')} às {String(session.hour).padStart(2, '0')}:00
      </p>
      {keyState === 'recover' && (
        <>
          <KeyRecovery onRecovered={() => setKeyState('ready')} />
          <button
            className="mb-3 text-xs text-white/60 underline"
            onClick={() => confirm('Gerar uma NOVA chave? Os resumos antigos ficarão ilegíveis para sempre, a menos que você ache a chave de recuperação anterior.') && createKey()}
          >
            Perdi a chave de recuperação
          </button>
        </>
      )}
      <Field label="Resumo da sessão (sigiloso: cifrado antes de sair do navegador)">
        <textarea
          autoFocus
          rows={8}
          className={inputCls}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva o resumo…"
        />
      </Field>
      {error && <p className="mb-3 rounded-xl bg-red-500/30 p-2 text-sm">{error}</p>}
      <div className="flex flex-wrap justify-between gap-2">
        <button
          className={btnCls}
          disabled={busy}
          onClick={() => confirm('Encerrar a sessão sem salvar resumo?') && onDone()}
        >
          Encerrar sem resumo
        </button>
        <button
          className={`${btnCls} bg-white/30 disabled:opacity-40`}
          disabled={busy || !text.trim() || keyState === 'loading' || keyState === 'recover'}
          onClick={() => guard(keyState === 'create' ? createKey : persist)}
        >
          {keyState === 'create' ? 'Criar chave e salvar' : 'Salvar resumo'}
        </button>
      </div>
    </Modal>
  )
}
