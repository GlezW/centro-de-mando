import { describe, it, expect } from 'vitest'
import { epley1RM, detectPRs, detectVolumePR, volume, weeklySetsByMuscle } from '../src/lib/calc'
import { fromLb, toLb } from '../src/lib/units'

const s = (weight_lb: number, reps: number, is_warmup = false) => ({ weight_lb, reps, is_warmup })

describe('epley1RM', () => {
  it('1 rep = el peso', () => expect(epley1RM(200, 1)).toBe(200))
  it('100 x 10 = 133.3', () => expect(epley1RM(100, 10)).toBe(133.3))
  it('135 x 8 = 171', () => expect(epley1RM(135, 8)).toBe(171))
  it('entradas inválidas = 0', () => {
    expect(epley1RM(0, 5)).toBe(0)
    expect(epley1RM(100, 0)).toBe(0)
  })
})

describe('volume', () => {
  it('ignora calentamiento', () => {
    expect(volume([s(45, 10, true), s(100, 10), s(100, 8)])).toBe(1800)
  })
})

describe('detectPRs', () => {
  it('sin historial => baseline', () => {
    const r = detectPRs(s(100, 10), [])
    expect(r.isBaseline).toBe(true)
    expect(r.prs.map((p) => p.type).sort()).toEqual(['e1rm', 'weight'])
  })

  it('más peso => PR de peso y de 1RM', () => {
    const r = detectPRs(s(110, 8), [s(100, 10)])
    const types = r.prs.map((p) => p.type)
    expect(types).toContain('weight')
    expect(types).toContain('e1rm') // 139.3 > 133.3
    expect(types).not.toContain('reps_at_weight')
    expect(r.isBaseline).toBe(false)
  })

  it('más reps al mismo peso => PR de reps', () => {
    const r = detectPRs(s(100, 11), [s(100, 10), s(100, 8)])
    expect(r.prs.map((p) => p.type)).toContain('reps_at_weight')
    expect(r.prs.find((p) => p.type === 'reps_at_weight')?.value).toBe(11)
  })

  it('empate no es PR', () => {
    expect(detectPRs(s(100, 10), [s(100, 10)]).prs).toEqual([])
  })

  it('menos peso y menos 1RM no es PR', () => {
    expect(detectPRs(s(80, 8), [s(100, 10)]).prs).toEqual([])
  })

  it('1RM puede ser PR sin serlo de peso (más reps con menos peso)', () => {
    // 100x10 => 133.3 ; 95x15 => 142.5
    const r = detectPRs(s(95, 15), [s(100, 10)])
    expect(r.prs.map((p) => p.type)).toEqual(['e1rm'])
  })

  it('una serie de calentamiento nunca es PR', () => {
    expect(detectPRs(s(300, 20, true), [s(100, 10)]).prs).toEqual([])
  })

  it('el calentamiento del historial no cuenta como récord previo', () => {
    // el calentamiento de 500 lb (error de captura) no debe bloquear un PR real
    const r = detectPRs(s(110, 8), [s(500, 5, true), s(100, 10)])
    expect(r.prs.map((p) => p.type)).toContain('weight')
  })

  it('reps al mismo peso requiere historial a ese peso', () => {
    const r = detectPRs(s(90, 20), [s(100, 10)])
    expect(r.prs.map((p) => p.type)).not.toContain('reps_at_weight')
  })
})

describe('detectVolumePR', () => {
  it('se anuncia solo al cruzar el mejor previo', () => {
    expect(detectVolumePR(1500, 1900, 1800)?.type).toBe('session_volume')
    expect(detectVolumePR(1900, 2300, 1800)).toBeNull()
    expect(detectVolumePR(500, 900, 1800)).toBeNull()
  })
  it('sin sesiones previas no hay PR', () => expect(detectVolumePR(0, 900, 0)).toBeNull())
})

describe('weeklySetsByMuscle', () => {
  it('cuenta solo series efectivas', () => {
    const out = weeklySetsByMuscle([
      { muscle: 'espalda', is_warmup: false },
      { muscle: 'espalda', is_warmup: true },
      { muscle: 'bíceps', is_warmup: false },
    ])
    expect(out).toEqual({ espalda: 1, 'bíceps': 1 })
  })
})

describe('units', () => {
  it('lb <-> kg', () => {
    expect(fromLb(220.5, 'kg')).toBe(100)
    expect(toLb(100, 'kg')).toBe(220.46)
    expect(fromLb(135, 'lb')).toBe(135)
  })
})
