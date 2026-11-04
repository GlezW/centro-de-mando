// Lógica pura (sin DB ni UI) para 1RM, PRs y volumen.
// Las series de calentamiento (is_warmup) NUNCA cuentan.

export type PRType = 'weight' | 'reps_at_weight' | 'e1rm' | 'session_volume'

export interface SetLike {
  weight_lb: number
  reps: number
  is_warmup: boolean
}

export interface PRResult {
  type: PRType
  value: number
  reps?: number
  weight_lb?: number
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** 1RM estimado con Epley: w·(1 + reps/30). Con 1 rep es el peso mismo. */
export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return round1(weight * (1 + reps / 30))
}

/** Volumen = Σ peso·reps de las series de trabajo. */
export function volume(sets: SetLike[]): number {
  return sets.reduce((acc, s) => (s.is_warmup ? acc : acc + s.weight_lb * s.reps), 0)
}

/**
 * Compara una serie nueva contra el historial previo (series de trabajo del
 * mismo ejercicio, sin incluir la nueva). Devuelve los PRs rotos.
 * Empates NO son PR. Sin historial => baseline (se guarda pero no se celebra).
 */
export function detectPRs(
  newSet: SetLike,
  history: SetLike[],
): { prs: PRResult[]; isBaseline: boolean } {
  if (newSet.is_warmup || newSet.weight_lb <= 0 || newSet.reps <= 0) {
    return { prs: [], isBaseline: false }
  }
  const prior = history.filter((s) => !s.is_warmup && s.weight_lb > 0 && s.reps > 0)
  const w = newSet.weight_lb
  const r = newSet.reps
  const e1 = epley1RM(w, r)

  if (prior.length === 0) {
    return {
      isBaseline: true,
      prs: [
        { type: 'weight', value: w, reps: r, weight_lb: w },
        { type: 'e1rm', value: e1, reps: r, weight_lb: w },
      ],
    }
  }

  const prs: PRResult[] = []
  const maxWeight = Math.max(...prior.map((s) => s.weight_lb))
  if (w > maxWeight) prs.push({ type: 'weight', value: w, reps: r, weight_lb: w })

  const sameWeight = prior.filter((s) => s.weight_lb === w)
  if (sameWeight.length > 0 && r > Math.max(...sameWeight.map((s) => s.reps))) {
    prs.push({ type: 'reps_at_weight', value: r, reps: r, weight_lb: w })
  }

  const maxE1 = Math.max(...prior.map((s) => epley1RM(s.weight_lb, s.reps)))
  if (e1 > maxE1) prs.push({ type: 'e1rm', value: e1, reps: r, weight_lb: w })

  return { prs, isBaseline: false }
}

/**
 * PR de volumen de sesión (por ejercicio): se anuncia solo en la serie que
 * hace cruzar el mejor volumen previo, para no repetir el aviso en cada serie.
 * `before`/`after`: volumen de hoy antes/después de la serie. `bestPrior`: mejor
 * volumen de sesiones anteriores (0 si no hay).
 */
export function detectVolumePR(before: number, after: number, bestPrior: number): PRResult | null {
  if (bestPrior <= 0) return null
  if (before <= bestPrior && after > bestPrior) return { type: 'session_volume', value: after }
  return null
}

/** Suma de series efectivas (no calentamiento) por músculo. */
export function weeklySetsByMuscle<T extends { muscle: string; is_warmup: boolean }>(
  sets: T[],
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of sets) if (!s.is_warmup) out[s.muscle] = (out[s.muscle] ?? 0) + 1
  return out
}
