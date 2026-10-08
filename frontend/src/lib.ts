import type { Appointment, Patient } from './types'

export const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 07h às 21h
export const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Segunda-feira da semana de `d`. Domingo pertence à semana que termina nele. */
export function mondayOf(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  return r
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function formatPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Sem DDI informado (10 ou 11 dígitos = DDD + número): assume Brasil.
  return digits.length <= 11 ? `55${digits}` : digits
}

/** Monta o link wa.me com a mensagem; aceita {nome} e {hora} como variáveis. */
export function whatsappLink(p: Patient, hour?: number): string | null {
  if (!p.phone || p.phone.replace(/\D/g, '').length < 10) return null
  const text = (p.whatsapp_message ?? '')
    .replaceAll('{nome}', p.name.split(' ')[0])
    .replaceAll('{hora}', hour === undefined ? '' : `${pad(hour)}:00`)
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${formatPhoneDigits(p.phone)}${q}`
}

export function apptTime(a: Appointment): Date {
  const [y, m, d] = a.date.split('-').map(Number)
  return new Date(y, m - 1, d, a.hour, 0, 0)
}

/** Texto legível sobre cor de fundo, para a legibilidade dos blocos coloridos. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.72 ? '#1c1c1e' : '#ffffff'
}
