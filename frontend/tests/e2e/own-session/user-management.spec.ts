import { test, expect } from '@playwright/test'
import { uniqueEmail } from '../helpers/db-helper'
import { dbHelper, loginAs } from '../helpers/test-helpers'
import { AppShell } from '../pages/AppShell'
import { LoginPage } from '../pages/LoginPage'
import { UserManagementPage } from '../pages/UserManagementPage'

test.describe('User management as a super admin', () => {
  test('creates a super admin from the right-side menu', async ({ page }) => {
    await loginAs(page, 'super-admin')
    const shell = new AppShell(page)
    const users = new UserManagementPage(page)
    const email = uniqueEmail('super')

    await shell.goto('/')
    await shell.adminMenuToggle.click()
    await shell.adminNavItem('super-admins').click()
    await expect(users.root('super-admin')).toBeVisible()

    await users.create('E2E New Super Admin', email)
    await users.rename(email, 'E2E Renamed Super Admin')
    await users.delete(email)
  })

  test('creates an admin who can then sign in', async ({ page }) => {
    await loginAs(page, 'super-admin')
    const shell = new AppShell(page)
    const users = new UserManagementPage(page)
    const email = uniqueEmail('admin')
    const password = 'admin-password-123'

    await shell.goto('/')
    await shell.adminMenuToggle.click()
    await shell.adminNavItem('admins').click()
    await expect(users.root('admin')).toBeVisible()

    await users.create('E2E New Admin', email)
    await users.setPassword(email, password)

    await shell.logoutViaUI()
    await new LoginPage(page).submit(email, password)
    await expect(shell.navItem('users')).toBeVisible({ timeout: 15000 })
    await expect(shell.adminMenuToggle).toHaveCount(0)
  })

  test('cannot delete themselves', async ({ page }) => {
    const me = await loginAs(page, 'super-admin')
    const users = new UserManagementPage(page)

    await users.open('super-admin')
    await expect(users.row(me.email)).toBeVisible()
    await expect(users.row(me.email).locator('[data-testid^="edit-user-button-"]')).toBeVisible()
    await expect(users.row(me.email).locator('[data-testid^="delete-user-button-"]')).toHaveCount(0)
  })

  test('sees a taken email as an error on the email field', async ({ page }) => {
    await loginAs(page, 'super-admin')
    const existing = await dbHelper.createUser({ roles: ['admin'] })
    const users = new UserManagementPage(page)

    await users.open('admin')
    await page.getByTestId('add-user-button').click()
    await page.getByTestId('user-name-input').fill('E2E Duplicate')
    await page.getByTestId('user-email-input').fill(existing.email)
    await page.getByTestId('user-modal-submit-button').click()

    await expect(page.getByTestId('user-email-input')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('user-name-input')).not.toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('user-modal-submit-button')).toBeVisible()
    await expect(users.table.locator('tr[data-row-key]').filter({ hasText: 'E2E Duplicate' })).toHaveCount(0)
  })
})

test.describe('User management as an admin', () => {
  test('manages plain users but has no admin menu', async ({ page }) => {
    await loginAs(page, 'admin')
    const shell = new AppShell(page)
    const users = new UserManagementPage(page)
    const email = uniqueEmail('plain')

    await shell.goto('/')
    await expect(shell.adminMenuToggle).toHaveCount(0)
    await shell.navItem('users').click()
    await expect(users.root('user')).toBeVisible()

    await users.create('E2E New User', email)
    await users.delete(email)
  })

  test('is refused on the super admin pages', async ({ page }) => {
    await loginAs(page, 'admin')
    const users = new UserManagementPage(page)

    for (const path of ['/admin/super-admins', '/admin/admins']) {
      await users.goto(path)
      await expect(users.forbidden).toBeVisible()
      await expect(users.table).toHaveCount(0)
    }
  })
})

test.describe('User management as a plain user', () => {
  test('sees no user menus and is refused on every page', async ({ page }) => {
    await loginAs(page, 'user')
    const shell = new AppShell(page)
    const users = new UserManagementPage(page)

    await shell.goto('/')
    await expect(shell.navItem('examples')).toBeVisible()
    await expect(shell.navItem('users')).toHaveCount(0)
    await expect(shell.adminMenuToggle).toHaveCount(0)

    for (const path of ['/users', '/admin/super-admins', '/admin/admins']) {
      await users.goto(path)
      await expect(users.forbidden).toBeVisible()
    }
  })
})
