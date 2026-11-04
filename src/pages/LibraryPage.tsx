import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export default function LibraryPage() {
  const [q, setQ] = useState('')
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray(), []) ?? []
  const list = exercises.filter((e) => `${e.name} ${e.muscle_primary}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="page">
      <h1>Ejercicios</h1>
      <input className="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="muted small">GIF e instrucciones en español llegan en la Fase 2.</p>
      {list.map((e) => (
        <div className="card" key={e.id}>
          <strong>{e.name}</strong>
          <div className="muted small">{e.muscle_primary} · {e.equipment}</div>
          <textarea
            className="notes"
            placeholder="Notas de máquina (asiento, agarre…)"
            defaultValue={e.machine_notes}
            onBlur={(ev) => db.exercises.update(e.id, { machine_notes: ev.target.value })}
          />
        </div>
      ))}
    </div>
  )
}
