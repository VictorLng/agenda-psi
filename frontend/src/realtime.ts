import { useEffect, useRef } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export type Scope = 'appointments' | 'patients' | 'types' | 'settings' | 'notes'
const SCOPES: Scope[] = ['appointments', 'patients', 'types', 'settings', 'notes']
const DEBOUNCE_MS = 150

const subscribers = new Map<Scope, Set<() => void>>(SCOPES.map((s) => [s, new Set()]))
const timers = new Map<Scope, ReturnType<typeof setTimeout>>()

// Junta rajadas de eventos (ex.: troca com swap emite vários) em uma única atualização.
function notify(scope: Scope) {
  clearTimeout(timers.get(scope))
  timers.set(scope, setTimeout(() => subscribers.get(scope)?.forEach((cb) => cb()), DEBOUNCE_MS))
}
const notifyAll = () => SCOPES.forEach(notify)

let started = false

/** Uma única conexão e um único listener por aba; os componentes se inscrevem via useRealtime. */
function start() {
  if (started) return
  started = true

  const secure = location.protocol === 'https:'
  const port = Number(location.port) || (secure ? 443 : 80)
  ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

  const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: location.hostname,
    wsPort: port,
    wssPort: port,
    forceTLS: secure,
    enabledTransports: ['ws', 'wss'],
  })

  echo.channel('agenda').listen('.changed', (e: { scopes: Scope[] }) => e.scopes.forEach(notify))

  // Eventos perdidos enquanto estava offline/aba em segundo plano: rebusca tudo ao voltar.
  let first = true
  echo.connector.pusher.connection.bind('connected', () => {
    if (first) first = false
    else notifyAll()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') notifyAll()
  })
}

/** Executa `cb` sempre que algum dos escopos mudar no servidor (qualquer aba/dispositivo). */
export function useRealtime(scopes: Scope | Scope[], cb: () => void) {
  const ref = useRef(cb)
  ref.current = cb
  const key = Array.isArray(scopes) ? scopes.join(',') : scopes

  useEffect(() => {
    start()
    const fn = () => ref.current()
    const list = key.split(',') as Scope[]
    list.forEach((s) => subscribers.get(s)?.add(fn))
    return () => list.forEach((s) => subscribers.get(s)?.delete(fn))
  }, [key])
}
