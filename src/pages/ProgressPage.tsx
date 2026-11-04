import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { epley1RM } from '../lib/calc'
import { fmtWeight } from '../lib/units'
import { useSettings } from '../lib/useSettings'

const LABEL = {
  weight: 'Peso máximo',
  reps_at_weight: 'Reps a un peso',
  e1rm: '1RM estimado',
  session_volume: 'Volumen de sesión',
} as const

export default function ProgressPage() {
  const { units } = useSettings()
  const prs = useLiveQuery(async () => {
    const all = await db.prs.orderBy('date').reverse().toArray()
    const names = new Map((await db.exercises.toArray()).map((e) => [e.id, e.name]))
    return all.sort((a, b) => b.id - a.id).map((p) => ({ ...p, name: names.get(p.exercise_id) ?? '?' }))
  }, [])

  return (
    <div className="page">
      <h1>Progreso</h1>
      <p className="muted small">Gráficas, volumen semanal y peso corporal llegan en la Fase 3.</p>
      <h2>Historial de PRs</h2>
      {!prs?.length && <p className="muted">Aún no hay PRs. Registra series de trabajo para empezar.</p>}
      {prs?.map((p) => (
        <div className="card pr-row" key={p.id}>
          <div>
            <strong>{p.name}</strong>
            <div className="muted small">{LABEL[p.type]} · {p.date}</div>
          </div>
          <div className="pr-val">
            {p.type === 'reps_at_weight' && `${p.value} reps @ ${fmtWeight(p.weight_lb ?? 0, units)}`}
            {p.type === 'weight' && `${fmtWeight(p.value, units)} × ${p.reps}`}
            {p.type === 'e1rm' && fmtWeight(p.value || epley1RM(p.weight_lb ?? 0, p.reps ?? 0), units)}
            {p.type === 'session_volume' && fmtWeight(p.value, units)}
          </div>
        </div>
      ))}
    </div>
  )
}
