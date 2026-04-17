import { expect, test } from '@playwright/test'

test.describe('Rutas públicas y protección', () => {
  test('login muestra formulario de acceso', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /acceso al sistema/i })).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
  })

  test('sin sesión, /dashboard redirige a login', async ({ page }) => {
    const res = await page.goto('/dashboard', { waitUntil: 'commit' })
    expect(res?.status() ?? 0).toBeLessThan(400)
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })

  test('sin sesión, /admin/clubes redirige a login', async ({ page }) => {
    await page.goto('/admin/clubes', { waitUntil: 'commit' })
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })

  test('página de inicio responde', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.ok()).toBeTruthy()
  })
})
