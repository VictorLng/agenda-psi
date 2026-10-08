import type { ActiveSession } from './types'

const KEY = 'psi-active-session'

/** A sessão em andamento sobrevive a recarregar a página. */
export function loadSession(): ActiveSession | null {
  try {
    const v = localStorage.getItem(KEY)
    return v ? (JSON.parse(v) as ActiveSession) : null
  } catch {
    return null
  }
}

export function persistSession(s: ActiveSession | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch { /* sem localStorage: a sessão vale só até recarregar */ }
}
