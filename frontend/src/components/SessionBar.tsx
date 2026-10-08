import { useEffect, useState } from 'react'
import type { ActiveSession } from '../types'
import { btnCls } from './Modal'

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

export default function SessionBar({ session, onEnd }: { session: ActiveSession; onEnd: () => void }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="glass rise fixed bottom-4 left-1/2 z-40 flex max-w-[95vw] -translate-x-1/2 items-center gap-3 rounded-full py-2 pl-4 pr-2">
      <span className="h-3 w-3 shrink-0 animate-pulse rounded-full" style={{ background: session.color }} />
      <div className="min-w-0 text-sm leading-tight">
        <p className="truncate font-semibold">Sessão com {session.patientName}</p>
        <p className="text-xs text-white/75">🔕 avisos silenciados · {fmt(now - new Date(session.startedAt).getTime())}</p>
      </div>
      <button className={`${btnCls} shrink-0 bg-red-500/40`} onClick={onEnd}>Finalizar</button>
    </div>
  )
}
