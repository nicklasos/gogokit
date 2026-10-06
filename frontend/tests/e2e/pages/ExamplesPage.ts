import { expect, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class ExamplesPage extends BasePage {
  get root(): Locator {
    return this.page.getByTestId('examples-page')
  }

  get table(): Locator {
    return this.page.getByTestId('examples-table')
  }

  get rows(): Locator {
    return this.table.locator('tr[data-row-key]')
  }

  get addButton(): Locator {
    return this.page.getByTestId('examples-add-button')
  }

  row(title: string): Locator {
    return this.rows.filter({ hasText: title })
  }

  pageLink(page: number): Locator {
    return this.page.getByTitle(String(page), { exact: true })
  }

  async gotoList(query = ''): Promise<void> {
    await this.goto(`/examples${query}`)
    await expect(this.root).toBeVisible()
  }

  async clickAdd(): Promise<void> {
    await this.addButton.click()
    await expect(this.page.getByTestId('example-editor-page')).toBeVisible()
  }

  async closePreview(): Promise<void> {
    const dialog = this.page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).toBeHidden()
  }

  async edit(title: string): Promise<void> {
    await this.row(title).locator('[data-testid^="edit-example-button-"]').click()
    await expect(this.page.getByTestId('example-editor-page')).toBeVisible()
  }

  async delete(title: string): Promise<void> {
    await this.row(title).locator('[data-testid^="delete-example-button-"]').click()
    await this.page.locator('[data-testid^="confirm-delete-example-button-"]').click()
    await expect(this.row(title)).toHaveCount(0)
  }
}
