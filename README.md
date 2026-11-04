# Gym Companion

PWA personal para registrar entrenamientos. 100 % local (IndexedDB), sin cuenta ni nube, unidad base libras. Ver [PLAN.md](PLAN.md).

**Estado:** Fase 0 (base PWA) + Fase 1 (MVP de entreno) hechas. Progreso (gráficas), biblioteca con GIF, comida y respaldo son fases siguientes.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173 (accesible en tu red local)
npm test           # unit tests (PRs, 1RM, volumen, unidades)
npm run e2e        # Playwright móvil (necesita Chromium; CHROMIUM_PATH opcional)
npm run build      # build de producción + service worker
```

## Qué incluye la Fase 1
- Rutina de 5 días precargada (lun espalda/bíceps, mar pecho/tríceps/hombro, mié pierna, jue upper, vie pierna). La siembra es idempotente.
- Registro de series: peso, reps, RIR, calentamiento sí/no (el calentamiento no cuenta en volumen ni PRs).
- Última sesión del ejercicio visible, notas de máquina, temporizador de descanso (configurable en Ajustes).
- Cambio de ejercicio por sesión (se guarda `original_exercise_id` en cada serie; el historial de ambos se conserva).
- PRs automáticos: peso máximo, reps a un peso, 1RM estimado (Epley) y volumen por ejercicio en la sesión. La primera vez que haces un ejercicio es "baseline" y no se celebra. Historial en la pestaña Progreso.
- Libras/kg: se guarda siempre en lb; kg es solo visualización (Ajustes).

Pendiente de Fase 1 según el plan: editar la rutina desde la app (hoy se cambia en `src/seed.ts` y los ejercicios se pueden sustituir por sesión).

## Probar en tu Android

La PWA solo se instala por **HTTPS**. Opciones (gratis):

### A) GitHub Pages (ya configurado)
1. Haz merge de esta rama a `main`.
2. En GitHub: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
3. El workflow `.github/workflows/deploy.yml` publica en `https://<usuario>.github.io/centro-de-mando/`.

### B) Cloudflare Pages
1. *Workers & Pages → Create → Pages → Connect to Git*, elige el repo.
2. Build command: `npm run build` · Output directory: `dist` (sin `BASE_PATH`, queda en `/`).

### C) Vercel
Importa el repo; Vite se detecta solo (`npm run build`, `dist`).

### Instalar en el teléfono
1. Abre la URL en **Chrome** de Android.
2. Menú ⋮ → **Instalar aplicación** / **Agregar a pantalla de inicio**.
3. Ábrela una vez con internet (se cachea) y luego prueba en modo avión: debe abrir y registrar series.

### Probar rápido en red local (sin instalar)
`npm run dev` y abre `http://<IP-de-tu-PC>:5173` en el teléfono. Sirve para ver la UI, pero el service worker/instalación requiere HTTPS.

> Los datos viven en el navegador de cada URL. Si cambias de dominio (p. ej. de una vista previa a la definitiva) empiezas con datos vacíos; el respaldo JSON (Fase 5) resolverá eso. No borres los datos del sitio en Chrome.
