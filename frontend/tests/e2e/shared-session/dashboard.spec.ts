import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/DashboardPage'

test.describe('Dashboard', () => {
  test('shows dashboard for authenticated user', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await page.goto('/')
    await dashboard.expectVisible()
    await expect(dashboard.welcome).toBeVisible()
  })
})
