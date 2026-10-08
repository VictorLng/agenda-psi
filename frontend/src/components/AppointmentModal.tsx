import { useState } from 'react'
import { api } from '../api'
import { WEEKDAYS, pad, whatsappLink } from '../lib'
import type { ActiveSession, Appointment, AppointmentType, Patient } from '../types'
import ClampText from './ClampText'
import Modal, { Field, ScopeModal, btnCls, inputCls } from './Modal'
import TypeModal from './TypeModal'

interface Props {
  date: string
  hour: number
  existing?: Appointment
  patients: Patient[]
  types: AppointmentType[]
  onClose: () => void
  onChanged: () => void
  onTypesChanged: () => void
  onStartSession: (s: ActiveSession) => void
}

const OTHER = '__other'

export default function AppointmentModal({ date, hour, existing, patients, types, onClose, onChanged, onTypesChanged, onStartSession }: Props) {
  const [patientId, setPatientId] = useState<number | ''>(existing?.patient_id ?? patients[0]?.id ?? '')
  const [typeId, setTypeId] = useState<number | null>(existing ? existing.type_id : (types[0]?.id ?? null))
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [repeat, setRepeat] = useState(false)
  const [applyFuture, setApplyFuture] = useState(true)
  const [showType, setShowType] = useState(false)
  const [askDelete, setAskDelete] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const weekday = WEEKDAYS[(dt.getDay() + 6) % 7]
  const label = `${weekday}, ${pad(d)}/${pad(m)} às ${pad(hour)}:00`
  const patient = patients.find((p) => p.id === patientId)
  const wa = patient ? whatsappLink(patient, hour) : null
  const isRecurring = !!existing?.recurrence_id

  // Iniciar sessão (pelo botão ou pelo WhatsApp) liga o modo sessão: avisos silenciados.
  const begin = () => {
    if (!patient) return
    onStartSession({
      patientId: patient.id,
      patientName: patient.name,
      color: patient.color,
      date,
      hour,
      startedAt: new Date().toISOString(),
    })
  }

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      onChanged()
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const save = () =>
    run(() => {
      const body = { patient_id: Number(patientId), type_id: typeId, date, hour, notes: notes.trim() || null }
      return existing
        ? api.updateAppointment(existing.id, { ...body, apply_future: isRecurring && applyFuture })
        : api.createAppointment({ ...body, repeat })
    })

  return (
    <>
      <Modal title={existing ? 'Atendimento' : 'Novo atendimento'} onClose={onClose}>
        <p className="mb-4 text-sm text-white/80">
          {label}
          {isRecurring && <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">↻ toda {weekday.toLowerCase()}</span>}
        </p>
        {patients.length === 0 ? (
          <p className="mb-4 rounded-xl bg-white/10 p-3 text-sm">
            Cadastre um paciente primeiro (botão “Pacientes” na tela inicial).
          </p>
        ) : (
          <>
            <Field label="Paciente">
              <select
                className={`${inputCls} [&>option]:text-black`}
                value={patientId}
                onChange={(e) => setPatientId(Number(e.target.value))}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            {patient?.description && (
              <ClampText
                text={patient.description}
                className="mb-3 rounded-xl border-l-4 bg-white/10 p-3 text-sm"
                style={{ borderColor: patient.color }}
              />
            )}
            <Field label="Tipo de atendimento">
              <select
                className={`${inputCls} [&>option]:text-black`}
                value={typeId ?? ''}
                onChange={(e) => (e.target.value === OTHER ? setShowType(true) : setTypeId(e.target.value ? Number(e.target.value) : null))}
              >
                <option value="">Sem tipo</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value={OTHER}>Outro…</option>
              </select>
            </Field>
            <Field label="Observações desta sessão">
              <textarea className={inputCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            {!existing && (
              <label className="mb-3 flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
                Repetir toda {weekday.toLowerCase()} às {pad(hour)}:00, em todas as semanas
              </label>
            )}
            {isRecurring && (
              <label className="mb-3 flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" checked={applyFuture} onChange={(e) => setApplyFuture(e.target.checked)} />
                Aplicar paciente, tipo e observações também às próximas semanas
              </label>
            )}
            <div className="mb-3 flex flex-wrap gap-2">
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" onClick={begin} className={`${btnCls} bg-emerald-400/30`}>
                  Iniciar conversa no WhatsApp
                </a>
              )}
              <button
                className={`${btnCls} bg-white/30`}
                onClick={() => {
                  begin()
                  onClose()
                }}
              >
                ▶ Iniciar sessão
              </button>
            </div>
            {patient && !wa && (
              <p className="mb-3 text-xs text-white/60">Sem telefone válido: o botão de WhatsApp aparece quando o paciente tiver um.</p>
            )}
          </>
        )}
        {error && <p className="mb-3 rounded-xl bg-red-500/30 p-2 text-sm">{error}</p>}
        <div className="flex justify-between gap-2">
          {existing ? (
            <button
              disabled={busy}
              className={`${btnCls} bg-red-500/30`}
              onClick={() => (isRecurring ? setAskDelete(true) : confirm('Desmarcar este atendimento?') && run(() => api.deleteAppointment(existing.id)))}
            >
              Desmarcar
            </button>
          ) : <span />}
          <button disabled={busy || patientId === ''} className={`${btnCls} bg-white/30 disabled:opacity-40`} onClick={save}>
            Salvar
          </button>
        </div>
      </Modal>

      {showType && (
        <TypeModal
          onClose={() => setShowType(false)}
          onCreated={(t) => {
            setTypeId(t.id)
            setShowType(false)
            onTypesChanged()
          }}
        />
      )}

      {askDelete && existing && (
        <ScopeModal
          title="Desmarcar atendimento recorrente"
          text={`${label} faz parte de uma recorrência semanal.`}
          onClose={() => setAskDelete(false)}
          options={[
            { label: 'Só esta semana', description: 'A recorrência continua nas outras semanas.', onClick: () => run(() => api.deleteAppointment(existing.id, 'one')) },
            { label: 'Esta e as próximas', description: 'Encerra a recorrência a partir daqui. O histórico fica.', onClick: () => run(() => api.deleteAppointment(existing.id, 'future')) },
          ]}
        />
      )}
    </>
  )
}
