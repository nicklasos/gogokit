import { expect, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class DashboardPage extends BasePage {
  get root(): Locator {
    return this.page.getByTestId('dashboard-page')
  }

  get welcome(): Locator {
    return this.page.getByTestId('dashboard-welcome')
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible()
  }
}
