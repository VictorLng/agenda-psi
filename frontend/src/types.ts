export interface Patient {
  id: number
  name: string
  color: string
  description: string | null
  phone: string | null
  whatsapp_message: string | null
}

export interface AppointmentType {
  id: number
  name: string
  color: string
}

export interface Appointment {
  id: number
  patient_id: number
  date: string // YYYY-MM-DD
  hour: number
  notes: string | null
  type_id: number | null
  type: AppointmentType | null
  recurrence_id: number | null
  original_date: string | null
  patient: Patient
}

export interface Settings {
  owner_name: string
  bg_from: string
  bg_via: string
  bg_to: string
}

export interface SessionNote {
  id: number
  patient_id: number
  session_date: string
  hour: number
  started_at: string
  ended_at: string
  ciphertext: string
  iv: string
  patient: Pick<Patient, 'id' | 'name' | 'color'>
}

export interface KeyBackup {
  exists: boolean
  wrapped_key?: string
  iv?: string
}

export interface ActiveSession {
  patientId: number
  patientName: string
  color: string
  date: string
  hour: number
  startedAt: string // ISO
}
