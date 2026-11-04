import { useEffect, useState } from 'react'

interface Props {
  /** timestamp (ms) en que termina el descanso; null = inactivo */
  endsAt: number | null
  onChange: (endsAt: number | null) => void
}

export default function RestTimer({ endsAt, onChange }: Props) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!endsAt) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [endsAt])

  const left = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0
  const done = !!endsAt && left === 0

  useEffect(() => {
    if (done) {
      navigator.vibrate?.([200, 100, 200])
      const t = setTimeout(() => onChange(null), 4000)
      return () => clearTimeout(t)
    }
  }, [done, onChange])

  if (!endsAt) return null
  const mm = String(Math.floor(left / 60)).padStart(1, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className={done ? 'rest done' : 'rest'} role="timer">
      <span className="rest-time">{done ? '¡Listo!' : `Descanso ${mm}:${ss}`}</span>
      {!done && <button onClick={() => onChange(endsAt - 15000)}>−15s</button>}
      {!done && <button onClick={() => onChange(endsAt + 15000)}>+15s</button>}
      <button onClick={() => onChange(null)}>Saltar</button>
    </div>
  )
}
