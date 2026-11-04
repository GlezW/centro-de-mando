import { useState } from 'react'
import TrainPage from './pages/TrainPage'
import ProgressPage from './pages/ProgressPage'
import LibraryPage from './pages/LibraryPage'
import FoodPage from './pages/FoodPage'
import SettingsPage from './pages/SettingsPage'

const TABS = [
  { id: 'train', label: 'Entreno', icon: '🏋️' },
  { id: 'progress', label: 'Progreso', icon: '📈' },
  { id: 'library', label: 'Ejercicios', icon: '📚' },
  { id: 'food', label: 'Comida', icon: '🍽️' },
  { id: 'settings', label: 'Ajustes', icon: '⚙️' },
] as const
type Tab = (typeof TABS)[number]['id']

export default function App() {
  const [tab, setTab] = useState<Tab>('train')
  return (
    <div className="app">
      <main className="main">
        {tab === 'train' && <TrainPage />}
        {tab === 'progress' && <ProgressPage />}
        {tab === 'library' && <LibraryPage />}
        {tab === 'food' && <FoodPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <nav className="nav" aria-label="Navegación principal">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
