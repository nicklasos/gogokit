import { test, expect } from '@playwright/test'
import { dbHelper, loginAs } from '../helpers/test-helpers'
import { ExamplesPage } from '../pages/ExamplesPage'

test.describe('Examples list paging', () => {
  test('pages on the server and keeps the page in the URL', async ({ page }) => {
    const user = await loginAs(page, 'user')
    await dbHelper.createExamples(user.id, 25)
    const list = new ExamplesPage(page)

    await list.gotoList()
    await expect(list.rows).toHaveCount(20)

    await list.pageLink(2).click()
    await expect(list.rows).toHaveCount(5)
    await expect(page).toHaveURL(/page=2/)

    await page.reload()
    await expect(list.rows).toHaveCount(5)
  })

  test('steps back when the last row of a page is deleted', async ({ page }) => {
    const user = await loginAs(page, 'user')
    await dbHelper.createExamples(user.id, 21)
    const list = new ExamplesPage(page)

    await list.gotoList('?page=2&page_size=20')
    await expect(list.rows).toHaveCount(1)

    await list.rows.locator('[data-testid^="delete-example-button-"]').click()
    await page.locator('[data-testid^="confirm-delete-example-button-"]').click()

    await expect(list.rows).toHaveCount(20)
    await expect(page).toHaveURL(/page=1/)
  })
})
