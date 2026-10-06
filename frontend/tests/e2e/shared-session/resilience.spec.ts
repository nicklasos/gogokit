import { test, expect } from '@playwright/test'
import { AppShell } from '../pages/AppShell'
import { ExamplesPage } from '../pages/ExamplesPage'

test.describe('Unknown URLs', () => {
  test('show a not-found page inside the app', async ({ page }) => {
    const shell = new AppShell(page)

    await shell.goto('/no-such-page')
    await expect(page.getByTestId('page-not-found')).toBeVisible()
    await expect(shell.mainMenu).toBeVisible()
    await expect(page).toHaveURL(/no-such-page/)

    await page.getByTestId('not-found-home-button').click()
    await expect(page.getByTestId('dashboard-page')).toBeVisible()
  })

  test('nested unknown paths are not found either', async ({ page }) => {
    await new AppShell(page).goto('/examples/12/no-such-tab')
    await expect(page.getByTestId('page-not-found')).toBeVisible()
  })
})

test.describe('A page that crashes while rendering', () => {
  test('is contained: the menu keeps working and retrying recovers', async ({ page }) => {
    const shell = new AppShell(page)
    const list = new ExamplesPage(page)
    let broken = true

    // A row the page cannot render: the list endpoint answers with a null item.
    await page.route('**/api/v1/examples?*', (route) =>
      broken
        ? route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [null], pagination: { total: 1, current_page: 1, last_page: 1, per_page: 20 } }),
          })
        : route.fallback()
    )

    await shell.goto('/examples')
    await expect(page.getByTestId('crash-screen')).toBeVisible()
    await expect(shell.mainMenu).toBeVisible()

    await shell.navItem('dashboard').click()
    await expect(page.getByTestId('dashboard-page')).toBeVisible()
    await expect(page.getByTestId('crash-screen')).toHaveCount(0)

    await shell.navItem('examples').click()
    await expect(page.getByTestId('crash-screen')).toBeVisible()

    broken = false
    await page.reload()
    await expect(list.root).toBeVisible()
    await expect(page.getByTestId('crash-screen')).toHaveCount(0)
  })
})
