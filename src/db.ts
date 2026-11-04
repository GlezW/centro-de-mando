import Dexie, { type EntityTable } from 'dexie'
import type { PRType } from './lib/calc'
import type { Units } from './lib/units'

export interface Exercise {
  id: number
  name: string
  muscle_primary: string
  muscles_secondary: string[]
  equipment: string
  gif_url?: string
  instructions_es?: string
  machine_notes: string
}
export interface Routine { id: number; name: string }
export interface RoutineDay { id: number; routine_id: number; weekday: number; name: string } // 1=lun … 7=dom
export interface RoutineDayExercise {
  id: number
  day_id: number
  exercise_id: number
  order: number
  sets_target: number
  rep_min: number
  rep_max: number
}
export interface Session {
  id: number
  date: string // YYYY-MM-DD local
  routine_day_id?: number
  notes: string
  /** ejercicio original -> ejercicio sustituto, solo para esta sesión */
  swaps: Record<number, number>
}
export interface SetEntry {
  id: number
  session_id: number
  exercise_id: number
  original_exercise_id?: number
  set_number: number
  weight_lb: number
  reps: number
  rir?: number
  is_warmup: boolean
  created_at: number
}
export interface PR {
  id: number
  exercise_id: number
  type: PRType
  value: number
  reps?: number
  weight_lb?: number
  set_id?: number
  session_id: number
  date: string
}
export interface BodyWeight { id: number; date: string; weight_lb: number }
export interface Food {
  id: number; name: string; serving: string
  kcal: number; protein: number; carbs: number; fat: number; is_custom: boolean
}
export interface MealEntry {
  id: number; date: string; meal: string; food_id?: number; name: string
  kcal: number; protein: number; carbs: number; fat: number; qty: number
}
export interface Settings {
  id: 1
  units: Units
  daily_kcal: number
  daily_protein: number
  rest_seconds: number
  rest_warmup_seconds: number
  weekly_sets_range_per_muscle: [number, number]
}

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  units: 'lb',
  daily_kcal: 2500,
  daily_protein: 160,
  rest_seconds: 90,
  rest_warmup_seconds: 45,
  weekly_sets_range_per_muscle: [10, 20],
}

export class GymDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<Routine, 'id'>
  routine_days!: EntityTable<RoutineDay, 'id'>
  routine_day_exercises!: EntityTable<RoutineDayExercise, 'id'>
  sessions!: EntityTable<Session, 'id'>
  sets!: EntityTable<SetEntry, 'id'>
  prs!: EntityTable<PR, 'id'>
  body_weight!: EntityTable<BodyWeight, 'id'>
  foods!: EntityTable<Food, 'id'>
  meal_entries!: EntityTable<MealEntry, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor(name = 'gym-companion') {
    super(name)
    this.version(1).stores({
      exercises: '++id, name, muscle_primary',
      routines: '++id',
      routine_days: '++id, routine_id, weekday',
      routine_day_exercises: '++id, day_id, exercise_id',
      sessions: '++id, date, routine_day_id',
      sets: '++id, session_id, exercise_id, [session_id+exercise_id]',
      prs: '++id, exercise_id, session_id, date',
      body_weight: '++id, date',
      foods: '++id, name',
      meal_entries: '++id, date',
      settings: 'id',
    })
  }
}

export const db = new GymDB()
