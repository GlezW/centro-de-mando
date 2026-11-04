import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type RoutineDayExercise, type SetEntry } from '../db'
import { epley1RM, volume, type PRResult } from '../lib/calc'
import { deleteSet, lastSessionSets, logSet } from '../lib/workout'
import { fmtWeight, fromLb, toLb } from '../lib/units'
import { useSettings } from '../lib/useSettings'
import SwapDialog from './SwapDialog'

interface Props {
  sessionId: number
  target: RoutineDayExercise
  /** ejercicio efectivo hoy (puede ser sustituto) */
  exerciseId: number
  onSwap: (originalId: number, newId: number) => void
  onLogged: (celebrate: PRResult[], isWarmup: boolean, name: string) => void
}

export default function ExerciseCard({ sessionId, target, exerciseId, onSwap, onLogged }: Props) {
  const { units } = useSettings()
  const originalId = target.exercise_id
  const swapped = exerciseId !== originalId

  const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId])
  const original = useLiveQuery(() => db.exercises.get(originalId), [originalId])
  const sets = useLiveQuery(
    () => db.sets.where('[session_id+exercise_id]').equals([sessionId, exerciseId]).sortBy('set_number'),
    [sessionId, exerciseId],
  ) ?? []
  const last = useLiveQuery(() => lastSessionSets(exerciseId, sessionId), [exerciseId, sessionId, sets.length])

  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRir] = useState('')
  const [warmup, setWarmup] = useState(false)
  const [open, setOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const [error, setError] = useState('')

  // prellenar con la última serie de hoy o la mejor serie de la última sesión
  useEffect(() => {
    if (weight || reps) return
    const ref = [...sets].reverse().find((s) => !s.is_warmup) ?? last?.sets.filter((s) => !s.is_warmup).at(-1)
    if (ref) {
      setWeight(String(fromLb(ref.weight_lb, units)))
      setReps(String(ref.reps))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last, units])

  if (!exercise) return null
  const working = sets.filter((s) => !s.is_warmup)
  const doneWork = working.length

  async function submit() {
    const w = Number(weight.replace(',', '.'))
    const r = Number(reps)
    if (!(w > 0) || !(r > 0) || !Number.isInteger(r)) {
      setError('Escribe peso y repeticiones válidos')
      return
    }
    setError('')
    const rirN = rir === '' ? undefined : Number(rir)
    const { celebrate } = await logSet({
      session_id: sessionId,
      exercise_id: exerciseId,
      original_exercise_id: swapped ? originalId : undefined,
      weight_lb: toLb(w, units),
      reps: r,
      rir: rirN,
      is_warmup: warmup,
    })
    onLogged(celebrate, warmup, exercise!.name)
    setWarmup(false)
    setRir('')
  }

  const fmtSet = (s: SetEntry) => `${fromLb(s.weight_lb, units)}×${s.reps}${s.is_warmup ? ' (cal.)' : ''}`

  return (
    <section className="card ex">
      <header className="ex-head">
        <div>
          <h3>{exercise.name}</h3>
          <div className="muted small">
            Meta {target.sets_target}×{target.rep_min}–{target.rep_max} · {doneWork}/{target.sets_target} series
            {swapped && <> · <em>en lugar de {original?.name}</em></>}
          </div>
        </div>
        <button className="ghost" onClick={() => setSwapOpen(true)} aria-label="Cambiar ejercicio">⇄</button>
      </header>

      {exercise.machine_notes && !open && (
        <div className="note-preview" onClick={() => setOpen(true)}>📝 {exercise.machine_notes}</div>
      )}
      <button className="link" onClick={() => setOpen(!open)}>{open ? 'Ocultar notas' : 'Notas de máquina'}</button>
      {open && (
        <textarea
          className="notes"
          placeholder="Altura de asiento, agarre, ajustes…"
          defaultValue={exercise.machine_notes}
          onBlur={(e) => db.exercises.update(exercise.id, { machine_notes: e.target.value })}
        />
      )}

      <div className="last">
        {last ? (
          <>
            <span className="muted small">Última vez ({last.date}): </span>
            <span className="small">{last.sets.map(fmtSet).join(' · ')}</span>
          </>
        ) : (
          <span className="muted small">Sin historial todavía</span>
        )}
      </div>

      {sets.length > 0 && (
        <ol className="sets">
          {sets.map((s) => (
            <li key={s.id} className={s.is_warmup ? 'warm' : ''}>
              <span>{s.is_warmup ? 'C' : s.set_number}</span>
              <span>{fmtWeight(s.weight_lb, units)} × {s.reps}</span>
              <span className="muted small">
                {s.rir !== undefined ? `RIR ${s.rir}` : ''}{!s.is_warmup ? ` · 1RM ${fromLb(epley1RM(s.weight_lb, s.reps), units)}` : ''}
              </span>
              <button className="ghost" aria-label="Borrar serie" onClick={() => deleteSet(s)}>✕</button>
            </li>
          ))}
        </ol>
      )}
      {working.length > 0 && <div className="muted small">Volumen: {fmtWeight(volume(sets), units)}</div>}

      <div className="entry">
        <label>Peso ({units})
          <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label>Reps
          <input inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} />
        </label>
        <label>RIR
          <input inputMode="numeric" value={rir} onChange={(e) => setRir(e.target.value)} placeholder="–" />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={warmup} onChange={(e) => setWarmup(e.target.checked)} /> Calentamiento
      </label>
      {error && <div className="error">{error}</div>}
      <button className="primary big" onClick={submit}>{warmup ? 'Registrar calentamiento' : 'Registrar serie'}</button>

      {swapOpen && (
        <SwapDialog
          originalId={originalId}
          currentId={exerciseId}
          onClose={() => setSwapOpen(false)}
          onPick={(id) => { setSwapOpen(false); setWeight(''); setReps(''); onSwap(originalId, id) }}
        />
      )}
    </section>
  )
}
