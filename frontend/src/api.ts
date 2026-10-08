import type { Appointment, AppointmentType, KeyBackup, Patient, SessionNote, Settings } from './types'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const first = body.errors ? Object.values<string[]>(body.errors)[0]?.[0] : undefined
    throw new Error(first ?? body.message ?? `Erro ${res.status}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

const send = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

export type PatientInput = Omit<Patient, 'id'>
export interface AppointmentInput {
  patient_id: number
  date: string
  hour: number
  notes: string | null
  type_id: number | null
  repeat?: boolean
  apply_future?: boolean
}

export type Scope = 'one' | 'future'

export const api = {
  settings: () => req<Settings>('/settings'),
  saveSettings: (s: Partial<Settings>) => req<Settings>('/settings', send('PUT', s)),
  patients: () => req<Patient[]>('/patients'),
  createPatient: (p: PatientInput) => req<Patient>('/patients', send('POST', p)),
  updatePatient: (id: number, p: PatientInput) => req<Patient>(`/patients/${id}`, send('PUT', p)),
  deletePatient: (id: number) => req<void>(`/patients/${id}`, send('DELETE')),
  appointments: (from: string, to: string) =>
    req<Appointment[]>(`/appointments?from=${from}&to=${to}`),
  createAppointment: (a: AppointmentInput) => req<Appointment>('/appointments', send('POST', a)),
  updateAppointment: (id: number, a: AppointmentInput) =>
    req<Appointment>(`/appointments/${id}`, send('PUT', a)),
  deleteAppointment: (id: number, scope: Scope = 'one') =>
    req<void>(`/appointments/${id}?scope=${scope}`, send('DELETE')),
  moveAppointment: (id: number, date: string, hour: number, scope: 'one' | 'series') =>
    req<Appointment>(`/appointments/${id}/move`, send('POST', { date, hour, scope })),
  notes: () => req<SessionNote[]>('/session-notes'),
  createNote: (n: {
    patient_id: number; session_date: string; hour: number
    started_at: string; ended_at: string; ciphertext: string; iv: string
  }) => req<SessionNote>('/session-notes', send('POST', n)),
  deleteNote: (id: number) => req<void>(`/session-notes/${id}`, send('DELETE')),
  keyBackup: () => req<KeyBackup>('/key-backup'),
  saveKeyBackup: (b: { wrapped_key: string; iv: string }) => req<KeyBackup>('/key-backup', send('PUT', b)),
  types: () => req<AppointmentType[]>('/appointment-types'),
  createType: (t: { name: string; color: string }) =>
    req<AppointmentType>('/appointment-types', send('POST', t)),
}
