import { expect, type Locator } from '@playwright/test'
import { AUTH_STORAGE_KEY } from '../helpers/test-helpers'
import { BasePage } from './BasePage'

export class AppShell extends BasePage {
  get userMenuTrigger(): Locator {
    return this.page.getByTestId('user-menu-button')
  }

  get mainMenu(): Locator {
    return this.page.getByTestId('main-menu')
  }

  get adminMenu(): Locator {
    return this.page.getByTestId('admin-menu')
  }

  get adminMenuToggle(): Locator {
    return this.page.getByTestId('admin-menu-toggle-button')
  }

  navItem(key: string): Locator {
    return this.page.getByTestId(`nav-${key}`)
  }

  adminNavItem(key: string): Locator {
    return this.page.getByTestId(`admin-menu-${key}`)
  }

  async openProfile(): Promise<void> {
    await this.userMenuTrigger.click()
    await this.page.getByTestId('user-menu-profile').click()
    await expect(this.page.getByTestId('profile-page')).toBeVisible()
  }

  async logoutViaUI(): Promise<void> {
    await this.userMenuTrigger.click()
    await this.page.getByTestId('user-menu-logout').click()
    await expect(this.loginEmailInput).toBeVisible({ timeout: 10000 })
  }

  async clearAuthStorage(): Promise<void> {
    await this.page.evaluate((key) => localStorage.removeItem(key), AUTH_STORAGE_KEY)
  }
}
