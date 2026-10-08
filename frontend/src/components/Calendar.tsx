import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useRealtime } from '../realtime'
import { HOURS, WEEKDAYS, addDays, mondayOf, pad, readableOn, toISO } from '../lib'
import type { ActiveSession, Appointment, AppointmentType, Patient } from '../types'
import AppointmentModal from './AppointmentModal'
import { ScopeModal, btnCls } from './Modal'

interface Props {
  patients: Patient[]
  types: AppointmentType[]
  onBack: () => void
  onPatients: () => void
  onTypesChanged: () => void
  onStartSession: (s: ActiveSession) => void
}

type Slot = { date: string; hour: number; existing?: Appointment }
type Drop = { appt: Appointment; date: string; hour: number }

const startWeek = () => {
  const t = new Date()
  return t.getDay() === 0 ? mondayOf(addDays(t, 1)) : mondayOf(t) // domingo mostra a próxima semana
}

export default function Calendar({ patients, types, onBack, onPatients, onTypesChanged, onStartSession }: Props) {
  const [monday, setMonday] = useState(startWeek)
  const [appts, setAppts] = useState<Appointment[]>([])
  const [slot, setSlot] = useState<Slot | null>(null)
  const [dragging, setDragging] = useState<Appointment | null>(null)
  const [over, setOver] = useState('')
  const [pending, setPending] = useState<Drop | null>(null)
  const [error, setError] = useState('')

  const days = useMemo(() => WEEKDAYS.map((_, i) => addDays(monday, i)), [monday])
  const from = toISO(days[0])
  const to = toISO(days[5])

  const load = useCallback(() => {
    api.appointments(from, to).then(setAppts).catch((e: Error) => setError(e.message))
  }, [from, to])
  useEffect(load, [load])
  useRealtime('appointments', load)

  const byKey = useMemo(() => new Map(appts.map((a) => [`${a.date}|${a.hour}`, a])), [appts])
  const today = toISO(new Date())
  const nowHour = new Date().getHours()

  const move = async (d: Drop, scope: 'one' | 'series') => {
    setPending(null)
    setError('')
    // Atualização otimista: a tela já mostra o resultado (com troca de lugar, se houver).
    const snapshot = appts
    setAppts((list) => {
      const other = list.find((x) => x.date === d.date && x.hour === d.hour && x.id !== d.appt.id)
      return list.map((x) =>
        x.id === d.appt.id ? { ...x, date: d.date, hour: d.hour }
          : other && x.id === other.id ? { ...x, date: d.appt.date, hour: d.appt.hour }
          : x,
      )
    })
    try {
      await api.moveAppointment(d.appt.id, d.date, d.hour, scope)
    } catch (e) {
      setAppts(snapshot)
      setError((e as Error).message)
    }
    load() // reconcilia com o servidor (recorrência inteira, ids novos)
  }

  const drop = (date: string, hour: number) => {
    const appt = dragging
    setDragging(null)
    setOver('')
    if (!appt || (appt.date === date && appt.hour === hour)) return
    // Só pergunta como aplicar quando o atendimento é recorrente.
    if (appt.recurrence_id) setPending({ appt, date, hour })
    else move({ appt, date, hour }, 'one')
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:p-6">
      <header className="glass rise flex flex-wrap items-center justify-between gap-2 rounded-3xl px-4 py-3">
        <button className={btnCls} onClick={onBack}>‹ Início</button>
        <div className="flex items-center gap-2">
          <button className={btnCls} aria-label="Semana anterior" onClick={() => setMonday(addDays(monday, -7))}>‹</button>
          <span className="min-w-44 text-center text-sm font-semibold sm:text-base">
            {pad(days[0].getDate())}/{pad(days[0].getMonth() + 1)} – {pad(days[5].getDate())}/{pad(days[5].getMonth() + 1)}/{days[5].getFullYear()}
          </span>
          <button className={btnCls} aria-label="Próxima semana" onClick={() => setMonday(addDays(monday, 7))}>›</button>
          <button className={btnCls} onClick={() => setMonday(startWeek())}>Hoje</button>
        </div>
        <button className={btnCls} onClick={onPatients}>Pacientes</button>
      </header>
      {error && <p className="rounded-xl bg-red-500/30 p-2 text-sm">{error}</p>}

      <div className="glass rise min-h-0 flex-1 overflow-auto rounded-3xl p-2">
        <div className="grid min-w-[760px] grid-cols-[3.5rem_repeat(6,1fr)] gap-1">
          <div />
          {days.map((d, i) => (
            <div key={i} className={`sticky top-0 z-10 rounded-xl py-2 text-center text-sm font-semibold backdrop-blur-xl ${toISO(d) === today ? 'bg-white/35' : 'bg-white/10'}`}>
              {WEEKDAYS[i]}
              <span className="block text-xs font-normal text-white/80">{pad(d.getDate())}/{pad(d.getMonth() + 1)}</span>
            </div>
          ))}
          {HOURS.map((h) => (
            <Row
              key={h}
              hour={h}
              days={days}
              byKey={byKey}
              today={today}
              nowHour={nowHour}
              over={over}
              onPick={setSlot}
              onDragStart={setDragging}
              onDragEnd={() => { setDragging(null); setOver('') }}
              onOver={setOver}
              onDrop={drop}
            />
          ))}
        </div>
      </div>

      {slot && (
        <AppointmentModal
          key={`${slot.date}${slot.hour}`}
          {...slot}
          patients={patients}
          types={types}
          onClose={() => setSlot(null)}
          onChanged={load}
          onTypesChanged={onTypesChanged}
          onStartSession={onStartSession}
        />
      )}

      {pending && (
        <ScopeModal
          title="Mover atendimento recorrente"
          text={`${pending.appt.patient.name} tem recorrência semanal. Como deseja trocar para ${pad(pending.hour)}:00 em ${pending.date.split('-').reverse().slice(0, 2).join('/')}?`}
          onClose={() => setPending(null)}
          options={[
            { label: 'Troca pontual', description: 'Só esta semana. A recorrência segue igual nas outras semanas.', onClick: () => move(pending, 'one') },
            { label: 'Trocar recorrência', description: 'Esta e todas as próximas semanas passam para o novo dia e horário.', onClick: () => move(pending, 'series') },
          ]}
        />
      )}
    </div>
  )
}

interface RowProps {
  hour: number
  days: Date[]
  byKey: Map<string, Appointment>
  today: string
  nowHour: number
  over: string
  onPick: (s: Slot) => void
  onDragStart: (a: Appointment) => void
  onDragEnd: () => void
  onOver: (key: string) => void
  onDrop: (date: string, hour: number) => void
}

function Row({ hour, days, byKey, today, nowHour, over, onPick, onDragStart, onDragEnd, onOver, onDrop }: RowProps) {
  return (
    <>
      <div className="pr-2 pt-1 text-right text-xs text-white/75">{pad(hour)}:00</div>
      {days.map((d) => {
        const date = toISO(d)
        const key = `${date}|${hour}`
        const a = byKey.get(key)
        const isNow = date === today && hour === nowHour
        const target = {
          onDragOver: (e: React.DragEvent) => {
            e.preventDefault()
            if (over !== key) onOver(key)
          },
          onDrop: (e: React.DragEvent) => {
            e.preventDefault()
            onDrop(date, hour)
          },
        }
        const hl = over === key ? 'ring-2 ring-white scale-[1.03]' : ''
        return a ? (
          <button
            key={date}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', String(a.id))
              onDragStart(a)
            }}
            onDragEnd={onDragEnd}
            {...target}
            onClick={() => onPick({ date, hour, existing: a })}
            className={`h-14 cursor-grab overflow-hidden rounded-xl border border-white/40 px-2 py-1 text-left text-xs shadow-md transition hover:scale-[1.03] ${hl}`}
            style={{ background: a.patient.color, color: readableOn(a.patient.color) }}
          >
            <span className="flex items-center gap-1 truncate text-sm font-semibold">
              {a.recurrence_id && <span title="Recorrente">↻</span>}
              <span className="truncate">{a.patient.name}</span>
            </span>
            <span className="flex items-center gap-1 truncate opacity-90">
              {a.type && <span className="inline-block h-2 w-2 shrink-0 rounded-full border border-white/70" style={{ background: a.type.color }} />}
              <span className="truncate">{[a.type?.name, a.notes].filter(Boolean).join(' · ') || a.patient.description}</span>
            </span>
          </button>
        ) : (
          <button
            key={date}
            aria-label={`Marcar ${date} ${hour}h`}
            onClick={() => onPick({ date, hour })}
            {...target}
            className={`h-14 rounded-xl border border-white/15 bg-white/5 transition hover:bg-white/25 ${isNow ? 'ring-2 ring-white/70' : ''} ${hl}`}
          />
        )
      })}
    </>
  )
}
