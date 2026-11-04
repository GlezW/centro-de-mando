import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { getOrCreateSession, weekdayOf } from '../lib/workout'
import SessionView from '../components/SessionView'

const DAYS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function TrainPage() {
  const days = useLiveQuery(() => db.routine_days.orderBy('weekday').toArray(), [])
  const [weekday, setWeekday] = useState(() => Math.min(weekdayOf(), 5))
  const [sessionId, setSessionId] = useState<number | null>(null)

  const day = days?.find((d) => d.weekday === weekday)
  const items = useLiveQuery(async () => {
    if (!day) return []
    const rows = (await db.routine_day_exercises.where('day_id').equals(day.id).sortBy('order'))
    const ex = new Map((await db.exercises.toArray()).map((e) => [e.id, e]))
    return rows.map((r) => ({ ...r, exercise: ex.get(r.exercise_id)! }))
  }, [day?.id])

  if (sessionId && day) {
    return <SessionView sessionId={sessionId} dayName={day.name} onExit={() => setSessionId(null)} />
  }

  return (
    <div className="page">
      <h1>Entreno</h1>
      <div className="chips">
        {days?.map((d) => (
          <button key={d.id} className={d.weekday === weekday ? 'chip active' : 'chip'} onClick={() => setWeekday(d.weekday)}>
            {DAYS[d.weekday]}
          </button>
        ))}
      </div>
      {day && (
        <>
          <h2>{day.name}</h2>
          {items?.map((it) => (
            <div className="card row" key={it.id}>
              <span>{it.exercise.name}</span>
              <span className="muted">{it.sets_target}×{it.rep_min}–{it.rep_max}</span>
            </div>
          ))}
          <button className="primary big" onClick={async () => setSessionId(await getOrCreateSession(day.id))}>
            Empezar / continuar entreno
          </button>
        </>
      )}
    </div>
  )
}
