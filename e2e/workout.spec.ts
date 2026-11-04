import { test, expect, type Locator } from '@playwright/test'

async function logSet(card: Locator, w: string, r: string, warmup = false) {
  await card.locator('.entry input').nth(0).fill(w)
  await card.locator('.entry input').nth(1).fill(r)
  const cb = card.getByLabel('Calentamiento')
  if (warmup) await cb.check()
  await card.getByRole('button', { name: /Registrar/ }).click()
}

test('abrir rutina → registrar series → ver PR', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Lun' }).click()
  await expect(page.getByText('Espalda / Bíceps')).toBeVisible()
  await page.getByRole('button', { name: /Empezar/ }).click()

  const card = page.locator('section.ex', { hasText: 'Jalón abierto' })
  await logSet(card, '40', '10', true) // calentamiento
  await expect(page.locator('.toast')).toHaveCount(0) // calentamiento nunca es PR
  await logSet(card, '100', '10')
  await expect(page.locator('.toast')).toHaveCount(0) // baseline: sin celebración
  await expect(page.locator('.rest')).toBeVisible()

  await logSet(card, '110', '8')
  await expect(page.locator('.toast')).toContainText('Nuevo PR')
  await expect(card.locator('.sets li')).toHaveCount(3)

  // aparece en el historial de PRs
  await page.getByRole('button', { name: /Progreso/ }).click()
  await expect(page.getByText('Peso máximo').first()).toBeVisible()

  // al volver, la "última vez" se muestra tras recargar con otra sesión no aplica; datos persisten:
  await page.reload()
  await page.getByRole('button', { name: /Progreso/ }).click()
  await expect(page.getByText('Jalón abierto').first()).toBeVisible()
})

test('cambiar ejercicio conserva original en la serie', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Mar' }).click()
  await page.getByRole('button', { name: /Empezar/ }).click()
  const card = page.locator('section.ex', { hasText: 'Pec deck' })
  await card.getByLabel('Cambiar ejercicio').click()
  await page.getByRole('button', { name: /Cruces en polea/ }).click()
  const swapped = page.locator('section.ex', { hasText: 'Cruces en polea' })
  await expect(swapped).toContainText('en lugar de Pec deck')
  await logSet(swapped, '30', '12')
  await expect(swapped.locator('.sets li')).toHaveCount(1)
})
