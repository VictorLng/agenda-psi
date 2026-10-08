import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'
import { checkDue, enableAlerts, testAlert } from './alerts'
import { toISO } from './lib'
import { useRealtime } from './realtime'
import type { ActiveSession, AppointmentType, Patient, Settings } from './types'
import { loadSession, persistSession } from './session'
import Calendar from './components/Calendar'
import EndSessionModal from './components/EndSessionModal'
import NotesModal from './components/NotesModal'
import SessionBar from './components/SessionBar'
import Home from './components/Home'
import PatientsModal from './components/PatientsModal'
import Splash from './components/Splash'

type Screen = 'splash' | 'home' | 'calendar'
interface Banner { title: string; subtitle: string; color: string }

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [types, setTypes] = useState<AppointmentType[]>([])
  const [showPatients, setShowPatients] = useState(false)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [session, setSession] = useState<ActiveSession | null>(loadSession)
  const [endingSession, setEndingSession] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const [loadError, setLoadError] = useState('')

  const loadPatients = useCallback(() => {
    api.patients().then(setPatients).catch(() => {})
  }, [])

  const loadTypes = useCallback(() => {
    api.types().then(setTypes).catch(() => {})
  }, [])

  useEffect(() => {
    loadTypes()
    api.settings().then(setSettings).catch((e: Error) => setLoadError(e.message))
    loadPatients()
  }, [loadPatients, loadTypes])

  useRealtime('patients', loadPatients)
  useRealtime('types', loadTypes)
  useRealtime('settings', () => {
    api.settings().then(setSettings).catch(() => {})
  })

  // Aviso de horário: confere a cada 20 s os atendimentos de hoje (funciona com a aba aberta).
  useEffect(() => {
    if (screen === 'splash') return
    const tick = () => {
      const today = toISO(new Date())
      api.appointments(today, today).then((list) => checkDue(
        list,
        (a) => setBanner({ title: `Hora da sessão: ${a.patient.name}`, subtitle: `${String(a.hour).padStart(2, '0')}:00`, color: a.patient.color }),
        !!sessionRef.current, // em sessão: sem som, notificação ou aviso
      )).catch(() => {})
    }
    tick()
    const id = setInterval(tick, 20_000)
    return () => clearInterval(id)
  }, [screen])

  const startSession = (s: ActiveSession) => {
    if (sessionRef.current) return // já há uma sessão em andamento
    persistSession(s)
    setSession(s)
    setBanner(null)
  }
  const finishSession = () => {
    persistSession(null)
    setSession(null)
    setEndingSession(false)
  }
  const runTestAlert = async () => {
    const msg = await testAlert()
    setBanner({ title: 'Teste de notificação', subtitle: 'Aviso na tela funcionando', color: '#30d158' })
    return msg
  }

  if (loadError) {
    return <div className="flex h-full items-center justify-center p-6 text-center">Não consegui falar com o servidor: {loadError}</div>
  }
  if (!settings) return null

  const enter = async (name: string) => {
    await enableAlerts() // dentro do clique, exigência dos navegadores
    if (name !== settings.owner_name) setSettings(await api.saveSettings({ owner_name: name }))
    setScreen('home')
  }

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${settings.bg_from}, ${settings.bg_via}, ${settings.bg_to})` }}
    >
      <div className="blob pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/25 blur-3xl" />
      <div className="blob pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-white/20 blur-3xl [animation-delay:-6s]" />

      <div className="relative h-full">
        {screen === 'splash' && <Splash name={settings.owner_name} onEnter={enter} />}
        {screen === 'home' && (
          <Home
            settings={settings}
            onSettings={setSettings}
            onOpenCalendar={() => setScreen('calendar')}
            onOpenPatients={() => setShowPatients(true)}
            onOpenNotes={() => setShowNotes(true)}
            onTestAlert={runTestAlert}
          />
        )}
        {screen === 'calendar' && (
          <Calendar patients={patients} types={types} onTypesChanged={loadTypes} onStartSession={startSession} onBack={() => setScreen('home')} onPatients={() => setShowPatients(true)} />
        )}
      </div>

      {showPatients && <PatientsModal patients={patients} onClose={() => setShowPatients(false)} onChanged={loadPatients} />}

      {showNotes && <NotesModal onClose={() => setShowNotes(false)} />}

      {session && screen !== 'splash' && <SessionBar session={session} onEnd={() => setEndingSession(true)} />}
      {session && endingSession && (
        <EndSessionModal session={session} onClose={() => setEndingSession(false)} onDone={finishSession} />
      )}

      {banner && (
        <div className="glass rise fixed right-4 top-4 z-[60] flex max-w-sm items-center gap-3 rounded-2xl p-4">
          <span className="h-10 w-2 rounded-full" style={{ background: banner.color }} />
          <div>
            <p className="font-semibold">{banner.title}</p>
            <p className="text-sm text-white/80">{banner.subtitle}</p>
          </div>
          <button onClick={() => setBanner(null)} className="ml-2 text-xl leading-none" aria-label="Fechar aviso">×</button>
        </div>
      )}
    </div>
  )
}
