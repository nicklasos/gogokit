import { test, expect } from '@playwright/test'
import { API_BASE, AUTH_STORAGE_KEY } from '../helpers/test-helpers'
import { ExampleEditorPage } from '../pages/ExampleEditorPage'
import { ExamplesPage } from '../pages/ExamplesPage'

test.describe('Examples CRUD', () => {
  test('creates, edits, and deletes an example', async ({ page }) => {
    const list = new ExamplesPage(page)
    const editor = new ExampleEditorPage(page)
    const title = `E2E Example ${Date.now()}`
    const edited = `${title} edited`

    await list.gotoList()
    await list.clickAdd()
    await editor.fillAndSave(title, 'desc')
    await expect(list.row(title)).toBeVisible()

    await list.edit(title)
    await expect(editor.titleInput).toHaveValue(title)
    await editor.titleInput.fill(edited)
    await editor.saveButton.click()
    await expect(list.root).toBeVisible({ timeout: 15000 })
    await expect(list.row(edited)).toBeVisible()

    await list.delete(edited)
  })

  test('shows a server validation error on the field it belongs to', async ({ page }) => {
    const list = new ExamplesPage(page)
    const editor = new ExampleEditorPage(page)

    await page.route('**/api/v1/examples', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'The given data was invalid.',
          error_key: 'validation.failed',
          errors: { title: ['validation.title.required'] },
        }),
      })
    })

    await list.gotoList()
    await list.clickAdd()
    await editor.titleInput.fill('Rejected by the server')
    await editor.saveButton.click()

    await expect(editor.titleInput).toHaveAttribute('aria-invalid', 'true')
    await expect(editor.descriptionInput).not.toHaveAttribute('aria-invalid', 'true')
    await expect(editor.root).toBeVisible()
  })
})

test.describe('Markdown description', () => {
  test('is written in the editor, previewed as text in the list and rendered in the viewer', async ({ page }) => {
    const list = new ExamplesPage(page)
    const editor = new ExampleEditorPage(page)
    const title = `E2E Markdown ${Date.now()}`

    await list.gotoList()
    await list.clickAdd()
    await editor.titleInput.fill(title)
    await editor.descriptionInput.click()
    await page.keyboard.type('## Release notes')
    await page.keyboard.press('Enter')
    await page.keyboard.type('This is **important** text.')
    await editor.saveButton.click()
    await expect(list.root).toBeVisible({ timeout: 15000 })

    const row = list.row(title)
    await expect(row).toContainText('Release notes This is important text.')
    await expect(row).not.toContainText('**')
    await expect(row).not.toContainText('##')

    await row.locator('[data-testid^="view-example-button-"]').click()
    const content = page.getByTestId('example-view-content')
    await expect(content.locator('h2')).toHaveText('Release notes')
    await expect(content.locator('strong')).toHaveText('important')
    await list.closePreview()

    await list.edit(title)
    await expect(editor.descriptionInput.locator('h2')).toHaveText('Release notes')
    await expect(editor.descriptionInput.locator('strong')).toHaveText('important')

    await editor.backButton.click()
    await expect(list.root).toBeVisible()
    await list.delete(title)
  })

  test('shows HTML in a description as text instead of running it', async ({ page }) => {
    const list = new ExamplesPage(page)
    const title = `E2E Markdown XSS ${Date.now()}`
    let dialogs = 0
    page.on('dialog', (dialog) => {
      dialogs += 1
      return dialog.dismiss()
    })

    await list.gotoList()
    const token = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').state?.token as string, AUTH_STORAGE_KEY)
    const created = await page.request.post(`${API_BASE}/examples`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title, description: '<img src=x onerror="alert(1)"><script>alert(2)</script>\n\n[link](javascript:alert(3))' },
    })
    expect(created.ok()).toBe(true)

    await page.reload()
    await list.row(title).locator('[data-testid^="view-example-button-"]').click()
    const content = page.getByTestId('example-view-content')
    await expect(content).toBeVisible()
    await expect(content.locator('img, script')).toHaveCount(0)
    await expect(content.locator('a[href^="javascript:"]')).toHaveCount(0)
    expect(dialogs).toBe(0)

    await list.closePreview()
    await list.delete(title)
  })
})
