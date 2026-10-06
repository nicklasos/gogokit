import { test, expect } from '@playwright/test'
import { ExampleEditorPage } from '../pages/ExampleEditorPage'
import { ExamplesPage } from '../pages/ExamplesPage'

test.describe('Unsaved changes', () => {
  test('prompts when leaving a dirty editor', async ({ page }) => {
    const list = new ExamplesPage(page)
    const editor = new ExampleEditorPage(page)
    await list.gotoList()
    await list.clickAdd()

    await editor.titleInput.fill('Dirty draft')
    await editor.backButton.click()

    await page.getByTestId('unsaved-changes-stay-button').click()
    await expect(editor.root).toBeVisible()
    await expect(editor.titleInput).toHaveValue('Dirty draft')

    await editor.backButton.click()
    await page.getByTestId('unsaved-changes-leave-button').click()
    await expect(list.root).toBeVisible({ timeout: 10000 })
  })
})
