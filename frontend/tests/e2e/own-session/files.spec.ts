import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/test-helpers'
import { AppShell } from '../pages/AppShell'

// The smallest valid PNG: one transparent pixel.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

test.describe('Files', () => {
  test('uploads a file, lists it and deletes it', async ({ page }) => {
    await loginAs(page, 'user')
    const shell = new AppShell(page)
    const rows = page.getByTestId('files-table').locator('tr[data-row-key]')

    await shell.goto('/')
    await shell.navItem('files').click()
    await expect(page.getByTestId('files-page')).toBeVisible()
    await expect(rows).toHaveCount(0)

    await page.getByTestId('file-upload').locator('input[type="file"]').setInputFiles({ name: 'e2e-pixel.png', mimeType: 'image/png', buffer: PNG })
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('e2e-pixel.png')
    await expect(rows.first().locator('[data-testid^="file-thumbnail-"]')).toHaveCount(1)

    await page.reload()
    await expect(rows).toHaveCount(1)

    await rows.first().locator('[data-testid^="delete-file-button-"]').click()
    await page.locator('[data-testid^="confirm-delete-file-button-"]').click()
    await expect(rows).toHaveCount(0)
  })

  test('does not upload a type the picker rules out', async ({ page }) => {
    await loginAs(page, 'user')
    const shell = new AppShell(page)
    let uploads = 0
    await page.route('**/api/v1/uploads', (route) => {
      if (route.request().method() === 'POST') uploads += 1
      return route.fallback()
    })

    await shell.goto('/files')
    await page.getByTestId('file-upload').locator('input[type="file"]').setInputFiles({ name: 'script.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') })

    await expect(page.getByTestId('files-table').locator('tr[data-row-key]')).toHaveCount(0)
    expect(uploads).toBe(0)
  })

  test('shows the server refusal when the content does not match the name', async ({ page }) => {
    await loginAs(page, 'user')
    const shell = new AppShell(page)

    await shell.goto('/files')
    const refused = page.waitForResponse((response) => response.url().endsWith('/api/v1/uploads') && response.request().method() === 'POST')
    await page.getByTestId('file-upload').locator('input[type="file"]').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('<html><script>alert(1)</script></html>') })

    expect((await refused).status()).toBe(400)
    await expect(page.getByTestId('files-table').locator('tr[data-row-key]')).toHaveCount(0)
    await expect(page.getByTestId('file-upload-button')).toBeEnabled()
  })
})
