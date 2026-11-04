import { db } from '../db'
import { useSettings } from '../lib/useSettings'

export default function SettingsPage() {
  const s = useSettings()
  const upd = (patch: Partial<typeof s>) => db.settings.update(1, patch)
  return (
    <div className="page">
      <h1>Ajustes</h1>
      <div className="card">
        <label className="row">
          <span>Unidad de peso</span>
          <select value={s.units} onChange={(e) => upd({ units: e.target.value as 'lb' | 'kg' })}>
            <option value="lb">Libras (lb)</option>
            <option value="kg">Kilogramos (kg)</option>
          </select>
        </label>
        <p className="muted small">Los datos siempre se guardan en libras; kg es solo para mostrar.</p>
        <label className="row">
          <span>Descanso entre series (s)</span>
          <input type="number" inputMode="numeric" value={s.rest_seconds} min={10} max={600}
            onChange={(e) => upd({ rest_seconds: Math.max(10, Number(e.target.value) || 90) })} />
        </label>
        <label className="row">
          <span>Descanso tras calentamiento (s)</span>
          <input type="number" inputMode="numeric" value={s.rest_warmup_seconds} min={0} max={600}
            onChange={(e) => upd({ rest_warmup_seconds: Math.max(0, Number(e.target.value) || 0) })} />
        </label>
      </div>
      <p className="muted small">Los datos viven solo en este teléfono (IndexedDB). El respaldo JSON/CSV llega en la Fase 5.</p>
    </div>
  )
}
