import { db, type SetEntry } from '../db'
import { detectPRs, detectVolumePR, volume, type PRResult } from './calc'

export const todayStr = (d = new Date()) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** lunes=1 … domingo=7 */
export const weekdayOf = (d = new Date()) => (d.getDay() === 0 ? 7 : d.getDay())

/** Devuelve la sesión de hoy para ese día de rutina, o la crea. */
export async function getOrCreateSession(routine_day_id: number): Promise<number> {
  const date = todayStr()
  const existing = await db.sessions.where('date').equals(date).filter((s) => s.routine_day_id === routine_day_id).first()
  if (existing) return existing.id
  return (await db.sessions.add({ date, routine_day_id, notes: '', swaps: {} } as never)) as number
}

export interface LogInput {
  session_id: number
  exercise_id: number
  original_exercise_id?: number
  weight_lb: number
  reps: number
  rir?: number
  is_warmup: boolean
}

/** Guarda la serie, detecta PRs, los persiste y devuelve los que hay que celebrar. */
export async function logSet(input: LogInput): Promise<{ set: SetEntry; celebrate: PRResult[] }> {
  return db.transaction('rw', [db.sets, db.prs, db.sessions], async () => {
    const session = await db.sessions.get(input.session_id)
    if (!session) throw new Error('Sesión no encontrada')

    const sameExercise = await db.sets.where('exercise_id').equals(input.exercise_id).toArray()
    const todays = sameExercise.filter((s) => s.session_id === input.session_id)
    const prior = sameExercise.filter((s) => s.session_id !== input.session_id)
    const priorWorkingInOtherSessions = prior.filter((s) => !s.is_warmup)
    // historial para PR = todo lo anterior (otras sesiones + hoy), solo trabajo
    const history = [...prior, ...todays].filter((s) => !s.is_warmup)

    const set_number = todays.length + 1
    const entry = {
      session_id: input.session_id,
      exercise_id: input.exercise_id,
      original_exercise_id: input.original_exercise_id,
      set_number,
      weight_lb: input.weight_lb,
      reps: input.reps,
      rir: input.rir,
      is_warmup: input.is_warmup,
      created_at: Date.now(),
    }
    const id = (await db.sets.add(entry as never)) as number
    const set: SetEntry = { ...entry, id }

    const { prs, isBaseline } = detectPRs(set, history)
    const found: PRResult[] = [...prs]

    if (!input.is_warmup) {
      const before = volume(todays)
      const after = before + set.weight_lb * set.reps
      const bySession = new Map<number, number>()
      for (const s of priorWorkingInOtherSessions) {
        bySession.set(s.session_id, (bySession.get(s.session_id) ?? 0) + s.weight_lb * s.reps)
      }
      const bestPrior = Math.max(0, ...bySession.values())
      const vol = detectVolumePR(before, after, bestPrior)
      if (vol) found.push(vol)
    }

    for (const p of found) {
      await db.prs.add({
        exercise_id: input.exercise_id,
        type: p.type, value: p.value, reps: p.reps, weight_lb: p.weight_lb,
        set_id: id, session_id: input.session_id, date: session.date,
      } as never)
    }
    return { set, celebrate: isBaseline ? [] : found }
  })
}

export async function deleteSet(set: SetEntry): Promise<void> {
  await db.transaction('rw', [db.sets, db.prs], async () => {
    await db.sets.delete(set.id)
    await db.prs.where('set_id').equals(set.id).delete()
    // renumerar las series restantes del ejercicio en la sesión
    const rest = (await db.sets.where('[session_id+exercise_id]').equals([set.session_id, set.exercise_id]).toArray())
      .sort((a, b) => a.set_number - b.set_number)
    for (let i = 0; i < rest.length; i++) await db.sets.update(rest[i].id, { set_number: i + 1 })
  })
}

/** Última sesión anterior (≠ actual) en que se hicieron series de trabajo del ejercicio. */
export async function lastSessionSets(exercise_id: number, current_session_id: number) {
  const all = await db.sets.where('exercise_id').equals(exercise_id).toArray()
  const others = all.filter((s) => s.session_id !== current_session_id)
  if (!others.length) return null
  const sessionIds = [...new Set(others.map((s) => s.session_id))]
  const sessions = (await db.sessions.bulkGet(sessionIds)).filter(Boolean) as { id: number; date: string }[]
  sessions.sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1))
  const last = sessions[0]
  if (!last) return null
  return {
    date: last.date,
    sets: others.filter((s) => s.session_id === last.id).sort((a, b) => a.set_number - b.set_number),
  }
}
