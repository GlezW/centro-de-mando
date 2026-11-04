import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

interface Props {
  originalId: number
  currentId: number
  onPick: (exerciseId: number) => void
  onClose: () => void
}

export default function SwapDialog({ originalId, currentId, onPick, onClose }: Props) {
  const data = useLiveQuery(async () => {
    const all = await db.exercises.orderBy('name').toArray()
    const original = all.find((e) => e.id === originalId)!
    return { all, original }
  }, [originalId])
  if (!data) return null
  const { all, original } = data
  const same = all.filter((e) => e.muscle_primary === original.muscle_primary)
  const rest = all.filter((e) => e.muscle_primary !== original.muscle_primary)

  const item = (e: (typeof all)[number]) => (
    <button key={e.id} className={e.id === currentId ? 'list-item active' : 'list-item'} onClick={() => onPick(e.id)}>
      {e.name}
      <span className="muted small"> · {e.equipment}</span>
      {e.id === originalId && <span className="muted small"> (original)</span>}
    </button>
  )

  return (
    <div className="modal" role="dialog" aria-label="Cambiar ejercicio" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Cambiar «{original.name}»</h2>
        <p className="muted small">Solo afecta a esta sesión. El historial de ambos ejercicios se conserva.</p>
        <h3>Mismo músculo ({original.muscle_primary})</h3>
        {same.map(item)}
        <h3>Otros</h3>
        {rest.map(item)}
        <button className="big" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}
