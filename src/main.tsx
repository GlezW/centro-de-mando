import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { seedIfEmpty } from './seed'
import './styles.css'

registerSW({ immediate: true })

// pide almacenamiento persistente para que Android no borre los datos
navigator.storage?.persist?.().catch(() => {})

seedIfEmpty().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
