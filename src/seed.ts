import { db, DEFAULT_SETTINGS, type Exercise } from './db'

type Seed = Omit<Exercise, 'id'>
const ex = (
  name: string, muscle_primary: string, equipment: string,
  muscles_secondary: string[] = [], machine_notes = '',
): Seed => ({ name, muscle_primary, muscles_secondary, equipment, machine_notes })

// Músculos (clave usada luego para el volumen semanal)
const EXERCISES: Seed[] = [
  // Espalda
  ex('Jalón abierto', 'espalda', 'polea', ['bíceps']),
  ex('Remo sentado en polea', 'espalda', 'polea', ['bíceps']),
  ex('Remo con mancuerna', 'espalda', 'mancuernas', ['bíceps']),
  ex('Remo en máquina', 'espalda', 'máquina', ['bíceps']),
  ex('Remo con barra', 'espalda', 'barra', ['bíceps', 'espalda baja']),
  ex('Jalón agarre cerrado', 'espalda', 'polea', ['bíceps']),
  // Bíceps
  ex('Curl predicador', 'bíceps', 'máquina / barra Z'),
  ex('Curl martillo', 'bíceps', 'mancuernas', ['antebrazo']),
  ex('Curl con barra', 'bíceps', 'barra'),
  // Pecho
  ex('Press inclinado con mancuernas', 'pecho', 'mancuernas', ['hombro', 'tríceps']),
  ex('Press inclinado en máquina', 'pecho', 'máquina', ['hombro', 'tríceps']),
  ex('Press plano con barra', 'pecho', 'barra', ['hombro', 'tríceps']),
  ex('Pec deck', 'pecho', 'máquina'),
  ex('Cruces en polea', 'pecho', 'polea'),
  // Hombro
  ex('Press militar', 'hombro', 'mancuernas / barra', ['tríceps']),
  ex('Elevaciones laterales', 'hombro', 'mancuernas'),
  ex('Pájaros (deltoide posterior)', 'hombro', 'máquina / mancuernas'),
  // Tríceps
  ex('Extensión de tríceps en polea', 'tríceps', 'polea'),
  ex('Extensión de tríceps sobre la cabeza', 'tríceps', 'polea / mancuerna'),
  ex('Fondos en máquina', 'tríceps', 'máquina', ['pecho']),
  // Pierna
  ex('Prensa de pierna', 'cuádriceps', 'máquina', ['glúteos']),
  ex('Sentadilla', 'cuádriceps', 'barra', ['glúteos', 'isquiotibiales']),
  ex('Extensión de cuádriceps', 'cuádriceps', 'máquina'),
  ex('Curl femoral', 'isquiotibiales', 'máquina'),
  ex('Peso muerto rumano', 'isquiotibiales', 'barra', ['glúteos', 'espalda baja']),
  ex('Abductores', 'glúteos', 'máquina'),
  ex('Aductores', 'aductores', 'máquina'),
  ex('Elevación de talones', 'pantorrillas', 'máquina'),
]

// rutina: weekday 1=lun … 5=vie. [nombre del ejercicio, series, rep_min, rep_max]
const ROUTINE: { weekday: number; name: string; exercises: [string, number, number, number][] }[] = [
  {
    weekday: 1, name: 'Espalda / Bíceps',
    exercises: [
      ['Jalón abierto', 4, 8, 12],
      ['Remo sentado en polea', 3, 8, 12],
      ['Remo con mancuerna', 3, 8, 12],
      ['Curl predicador', 3, 8, 12],
      ['Curl martillo', 3, 10, 15],
    ],
  },
  {
    weekday: 2, name: 'Pecho / Tríceps / Hombro',
    exercises: [
      ['Press inclinado con mancuernas', 4, 6, 10],
      ['Pec deck', 3, 10, 15],
      ['Press militar', 3, 6, 10],
      ['Elevaciones laterales', 4, 12, 20],
      ['Extensión de tríceps en polea', 3, 10, 15],
    ],
  },
  {
    weekday: 3, name: 'Pierna',
    exercises: [
      ['Prensa de pierna', 4, 8, 12],
      ['Extensión de cuádriceps', 3, 10, 15],
      ['Curl femoral', 3, 10, 15],
      ['Abductores', 3, 12, 20],
      ['Aductores', 3, 12, 20],
    ],
  },
  {
    weekday: 4, name: 'Upper',
    exercises: [
      ['Press inclinado con mancuernas', 3, 6, 10],
      ['Jalón abierto', 3, 8, 12],
      ['Press militar', 3, 6, 10],
      ['Remo sentado en polea', 3, 8, 12],
      ['Elevaciones laterales', 3, 12, 20],
      ['Curl predicador', 2, 8, 12],
      ['Extensión de tríceps en polea', 2, 10, 15],
    ],
  },
  {
    weekday: 5, name: 'Pierna',
    exercises: [
      ['Sentadilla', 4, 6, 10],
      ['Peso muerto rumano', 3, 8, 12],
      ['Curl femoral', 3, 10, 15],
      ['Abductores', 3, 12, 20],
      ['Aductores', 3, 12, 20],
      ['Elevación de talones', 4, 10, 15],
    ],
  },
]

/** Idempotente: solo siembra si aún no hay rutina. */
export async function seedIfEmpty(): Promise<void> {
  await db.transaction(
    'rw',
    [db.exercises, db.routines, db.routine_days, db.routine_day_exercises, db.settings],
    async () => {
      if (!(await db.settings.get(1))) await db.settings.add(DEFAULT_SETTINGS)
      if ((await db.routines.count()) > 0) return

      const ids = new Map<string, number>()
      for (const e of EXERCISES) ids.set(e.name, await db.exercises.add(e as never))

      const routine_id = await db.routines.add({ name: 'Rutina 5 días' } as never)
      for (const d of ROUTINE) {
        const day_id = await db.routine_days.add({ routine_id, weekday: d.weekday, name: d.name } as never)
        let order = 0
        for (const [name, sets, rep_min, rep_max] of d.exercises) {
          const exercise_id = ids.get(name)
          if (!exercise_id) throw new Error(`Ejercicio no sembrado: ${name}`)
          await db.routine_day_exercises.add({
            day_id, exercise_id, order: order++, sets_target: sets, rep_min, rep_max,
          } as never)
        }
      }
    },
  )
}
