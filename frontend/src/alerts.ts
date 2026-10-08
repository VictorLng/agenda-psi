import { apptTime } from './lib'
import type { Appointment } from './types'

const NOTIFIED_KEY = 'notified-appointments'
let ctx: AudioContext | null = null

/** Precisa ser chamado dentro de um clique: navegadores bloqueiam áudio e permissão sem gesto. */
export async function enableAlerts(): Promise<void> {
  try {
    ctx ??= new AudioContext()
    await ctx.resume()
  } catch { /* sem áudio disponível */ }
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

export function notificationStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

/** Sino de três notas sintetizado com Web Audio (sem arquivo de áudio). */
export function playChime(): void {
  if (!ctx) return
  const now = ctx.currentTime
  ;[880, 1108.73, 1318.51].forEach((freq, i) => {
    const osc = ctx!.createOscillator()
    const gain = ctx!.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = now + i * 0.22
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
    osc.connect(gain).connect(ctx!.destination)
    osc.start(t)
    osc.stop(t + 1.2)
  })
}

function loadNotified(): string[] {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]')
  } catch {
    return []
  }
}

/** Dispara aviso (ou só registra, se `muted`) para consultas cujo horário já chegou (janela de 5 min), uma vez por consulta. */
export function checkDue(appointments: Appointment[], onDue: (a: Appointment) => void, muted = false): void {
  const now = Date.now()
  const done = loadNotified()
  const fresh = [...done]
  for (const a of appointments) {
    const key = `${a.id}@${a.date}T${a.hour}`
    const diff = now - apptTime(a).getTime()
    if (diff >= 0 && diff < 5 * 60_000 && !done.includes(key)) {
      fresh.push(key)
      if (muted) continue // em sessão: registra como visto, sem som, notificação ou aviso na tela
      playChime()
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Sessão com ${a.patient.name}`, {
          body: `Agora, às ${String(a.hour).padStart(2, '0')}:00${a.notes ? ` — ${a.notes}` : ''}`,
          tag: key,
        })
      }
      onDue(a)
    }
  }
  if (fresh.length !== done.length) {
    try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify(fresh.slice(-200))) } catch { /* ignore */ }
  }
}

/** Botão de debug: toca o som e dispara uma notificação na hora. Deve ser chamado dentro de um clique. */
export async function testAlert(): Promise<string> {
  await enableAlerts()
  playChime()
  switch (notificationStatus()) {
    case 'granted':
      new Notification('Teste de notificação', { body: 'Se você está vendo isto, os avisos funcionam.', tag: 'test' })
      return 'Som tocado e notificação enviada.'
    case 'denied':
      return 'Som tocado, mas as notificações estão BLOQUEADAS no navegador (cadeado na barra de endereço > Notificações > Permitir).'
    case 'unsupported':
      return 'Som tocado, mas este navegador não suporta notificações.'
    default:
      return 'Som tocado, mas a permissão de notificação ainda não foi concedida.'
  }
}
