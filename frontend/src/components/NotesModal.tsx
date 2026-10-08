import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { decryptText, hasLocalKey } from '../crypto'
import { useRealtime } from '../realtime'
import type { SessionNote } from '../types'
import KeyRecovery from './KeyRecovery'
import Modal, { btnCls } from './Modal'

type Row = { note: SessionNote; text: string | null }

export default function NotesModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [hasKey, setHasKey] = useState(hasLocalKey())
  const [needsRecovery, setNeedsRecovery] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const notes = await api.notes()
      const out = await Promise.all(
        notes.map(async (note) => ({
          note,
          text: await decryptText(note.ciphertext, note.iv).catch(() => null),
        })),
      )
      setRows(out)
      if (!hasLocalKey() && notes.length) setNeedsRecovery((await api.keyBackup()).exists)
      setHasKey(hasLocalKey())
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])
  useEffect(() => { load() }, [load])
  useRealtime('notes', load)

  const remove = async (n: SessionNote) => {
    if (!confirm('Excluir este resumo permanentemente?')) return
    await api.deleteNote(n.id)
    load()
  }

  return (
    <Modal title="Resumos de sessões" onClose={onClose} wide>
      <p className="mb-3 text-xs text-white/70">
        Os resumos ficam cifrados no servidor e só são abertos aqui, com a chave deste navegador.
      </p>
      {needsRecovery && !hasKey && <KeyRecovery onRecovered={() => { setNeedsRecovery(false); load() }} />}
      {error && <p className="mb-3 rounded-xl bg-red-500/30 p-2 text-sm">{error}</p>}
      {rows?.length === 0 && <p className="text-sm text-white/70">Nenhum resumo ainda.</p>}
      <ul className="space-y-3">
        {rows?.map(({ note, text }) => {
          const mins = Math.round((new Date(note.ended_at).getTime() - new Date(note.started_at).getTime()) / 60000)
          return (
            <li key={note.id} className="glass rounded-2xl p-4">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <span className="h-5 w-1.5 rounded-full" style={{ background: note.patient.color }} />
                <b className="truncate">{note.patient.name}</b>
                <span className="text-white/70">
                  · {note.session_date.split('-').reverse().join('/')} {String(note.hour).padStart(2, '0')}:00 · {mins} min
                </span>
                <button className={`${btnCls} ml-auto bg-red-500/30 !px-3 !py-1 text-xs`} onClick={() => remove(note)}>Excluir</button>
              </div>
              {text === null
                ? <p className="text-sm italic text-white/60">🔒 Cifrado: este navegador não tem a chave correta.</p>
                : <p className="whitespace-pre-wrap text-sm">{text}</p>}
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
