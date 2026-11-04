import { useCallback, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { PRResult } from '../lib/calc'
import { fmtWeight } from '../lib/units'
import { useSettings } from '../lib/useSettings'
import ExerciseCard from './ExerciseCard'
import RestTimer from './RestTimer'

const PR_LABEL: Record<PRResult['type'], string> = {
  weight: 'Peso máximo',
  reps_at_weight: 'Más reps a ese peso',
  e1rm: '1RM estimado',
  session_volume: 'Volumen de sesión',
}

interface Props { sessionId: number; dayName: string; onExit: () => void }

export default function SessionView({ sessionId, dayName, onExit }: Props) {
  const settings = useSettings()
  const session = useLiveQuery(() => db.sessions.get(sessionId), [sessionId])
  const rows = useLiveQuery(async () => {
    const s = await db.sessions.get(sessionId)
    if (!s?.routine_day_id) return []
    return db.routine_day_exercises.where('day_id').equals(s.routine_day_id).sortBy('order')
  }, [sessionId])

  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [toast, setToast] = useState<{ name: string; prs: PRResult[] } | null>(null)
  const setRest = useCallback((v: number | null) => setRestEnd(v), [])

  async function swap(originalId: number, newId: number) {
    const s = await db.sessions.get(sessionId)
    if (!s) return
    const swaps = { ...s.swaps }
    if (newId === originalId) delete swaps[originalId]
    else swaps[originalId] = newId
    await db.sessions.update(sessionId, { swaps })
  }

  function onLogged(prs: PRResult[], isWarmup: boolean, name: string) {
    const secs = isWarmup ? settings.rest_warmup_seconds : settings.rest_seconds
    setRestEnd(secs > 0 ? Date.now() + secs * 1000 : null)
    if (prs.length) {
      setToast({ name, prs })
      navigator.vibrate?.(100)
      setTimeout(() => setToast(null), 6000)
    }
  }

  if (!session || !rows) return null
  return (
    <div className="page session">
      <div className="topbar">
        <button className="ghost" onClick={onExit}>← Rutina</button>
        <strong>{dayName}</strong>
        <span className="muted small">{session.date}</span>
      </div>

      {rows.map((r) => (
        <ExerciseCard
          key={r.id}
          sessionId={sessionId}
          target={r}
          exerciseId={session.swaps[r.exercise_id] ?? r.exercise_id}
          onSwap={swap}
          onLogged={onLogged}
        />
      ))}

      <button className="big" onClick={onExit}>Terminar entreno</button>

      {toast && (
        <div className="toast" role="status" onClick={() => setToast(null)}>
          <strong>🏆 ¡Nuevo PR! {toast.name}</strong>
          {toast.prs.map((p) => (
            <div key={p.type}>
              {PR_LABEL[p.type]}:{' '}
              {p.type === 'reps_at_weight'
                ? `${p.value} reps @ ${fmtWeight(p.weight_lb ?? 0, settings.units)}`
                : fmtWeight(p.value, settings.units)}
            </div>
          ))}
        </div>
      )}
      <RestTimer endsAt={restEnd} onChange={setRest} />
    </div>
  )
}
