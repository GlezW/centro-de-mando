# Gym Companion — Plan de construcción

PWA personal para Android, 100 % local (sin cuenta, sin nube). Unidad base: **libras (lb)**.

## Decisiones tomadas
- Plataforma: PWA instalable en Android (Chrome → "Agregar a pantalla de inicio"), funciona sin internet.
- Datos: solo en el teléfono (IndexedDB con Dexie). Sin sincronización por ahora.
- Stack: React + Vite + TypeScript, vite-plugin-pwa, Dexie, Recharts (o uPlot) para gráficas.
- Idioma de la interfaz: español.
- Usuario único (yo). Rutina de 5 días: lun espalda/bíceps, mar pecho/tríceps/hombro, mié pierna, jue upper, vie pierna.

## Funciones incluidas desde el inicio
1. Series de calentamiento marcadas aparte (no cuentan en volumen ni PRs).
2. Sugerencia de progresión (doble progresión): si en todas las series de trabajo llegué al tope del rango de repeticiones, sugerir subir peso; si no, sugerir mantener y buscar más repeticiones.
3. Notas por máquina (altura de asiento, agarre, ajustes) visibles al registrar.
4. Volumen semanal por músculo (series efectivas por músculo vs. rango objetivo).
5. Cambiar un ejercicio por otro en la sesión sin perder el historial de ninguno.
6. Exportar / importar respaldo (JSON y CSV).
7. Libras como unidad base; ajuste simple para mostrar kg si algún día lo necesito.

## Módulos
- **Entrenamiento:** rutina precargada y editable; registrar series (peso, reps, RIR, calentamiento sí/no); ver última sesión del ejercicio; temporizador de descanso; notas por ejercicio.
- **PRs automáticos:** peso máximo, reps máximas a un peso, 1RM estimado (Epley), volumen de sesión. Aviso al romper uno + historial de PRs.
- **Progreso:** gráfica por ejercicio (peso, 1RM estimado), volumen semanal por músculo, peso corporal, calendario de constancia.
- **Biblioteca de ejercicios:** GIF + músculos + instrucciones en español, con botón "cómo se hace" desde el registro.
- **Comida (manual):** alimentos propios (incluye comida salvadoreña), favoritos y recientes, calorías/proteína/carbos/grasas, metas diarias, agua.
- **Foto de comida con Claude (fase final, requiere servidor):** foto → estimación editable.

## Modelo de datos (IndexedDB)
- `exercises` {id, name, muscle_primary, muscles_secondary[], equipment, gif_url?, instructions_es?, machine_notes}
- `routines` {id, name} · `routine_days` {id, routine_id, weekday, name} · `routine_day_exercises` {id, day_id, exercise_id, order, sets_target, rep_min, rep_max}
- `sessions` {id, date, routine_day_id?, notes}
- `sets` {id, session_id, exercise_id, original_exercise_id?, set_number, weight_lb, reps, rir?, is_warmup}
- `prs` {id, exercise_id, type, value, reps?, weight_lb?, set_id, date}
- `body_weight` {id, date, weight_lb}
- `foods` {id, name, serving, kcal, protein, carbs, fat, is_custom} · `meal_entries` {id, date, meal, food_id?, name, kcal, protein, carbs, fat, qty}
- `settings` {units, daily_kcal, daily_protein, weekly_sets_range_per_muscle}

## API de ejercicios
- Fuente: ExerciseDB V1 gratuita (≈1,500 ejercicios con GIF, sin API key). Consultar **solo los ejercicios que uso**, nunca descarga masiva (sus términos la prohíben).
- Guardar en caché local los datos y el GIF de cada ejercicio la primera vez que se abre.
- Instrucciones en inglés → traducir al español una sola vez y guardar.
- Plan B si falla o cambia: dataset estático en GitHub con EN/ES (revisar licencia).

## Fases y criterio de "terminado"
**Fase 0 — Base.** Proyecto Vite + PWA instalable, Dexie, navegación inferior, tema oscuro minimalista. *Listo cuando:* se instala en Android y abre sin internet.
**Fase 1 — MVP de entreno.** Rutina precargada, registro de series con calentamiento, última sesión visible, temporizador, notas por máquina, cambio de ejercicio, PRs automáticos. *Listo cuando:* puedo registrar un día completo en el gym sin tocar nada más.
**Fase 2 — Biblioteca.** Búsqueda en ExerciseDB, GIF + instrucciones en español, caché local. *Listo cuando:* cada ejercicio de mi rutina muestra su GIF offline.
**Fase 3 — Progreso.** Gráficas por ejercicio, volumen semanal por músculo, peso corporal, calendario, sugerencia de progresión. 
**Fase 4 — Comida manual.** Alimentos propios, favoritos, metas, resumen diario, agua.
**Fase 5 — Respaldo.** Exportar/importar JSON y CSV.
**Fase 6 (después) — Foto de comida.** Función serverless con la API de Claude (la clave nunca va en la app) + estimación editable. Requiere decidir hosting y presupuesto.

## Pruebas
- Tests unitarios (Vitest) para: detección de PRs, 1RM estimado, volumen semanal, sugerencia de progresión.
- Pruebas end-to-end con Playwright en viewport móvil (flujo: abrir rutina → registrar series → ver PR).
- Prueba real en el Android desde una URL de vista previa (Cloudflare Pages / Vercel / GitHub Pages; HTTPS es necesario para instalar la PWA).

## Primer prompt para Claude Code
> Lee PLAN.md. Empieza por la Fase 0 y la Fase 1. Crea el proyecto con React + Vite + TypeScript, PWA con vite-plugin-pwa y Dexie. Precarga mi rutina de 5 días con ejercicios habituales (remos, jalón abierto, curl predicador, martillo, press inclinado, pec deck, press militar, elevaciones laterales, extensiones de tríceps, pierna, abductores, aductores). Escribe tests para PRs y 1RM. Al terminar, deja instrucciones para desplegar una vista previa y probarla en Android.
