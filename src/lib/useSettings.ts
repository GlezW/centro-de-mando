import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, type Settings } from '../db'

export function useSettings(): Settings {
  return useLiveQuery(() => db.settings.get(1), []) ?? DEFAULT_SETTINGS
}
