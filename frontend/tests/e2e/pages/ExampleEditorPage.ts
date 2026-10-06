import { expect, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class ExampleEditorPage extends BasePage {
  get root(): Locator {
    return this.page.getByTestId('example-editor-page')
  }

  get form(): Locator {
    return this.page.getByTestId('example-editor-form')
  }

  get titleInput(): Locator {
    return this.page.getByTestId('example-title-input')
  }

  /** The writing area of the markdown editor. */
  get descriptionInput(): Locator {
    return this.page.getByTestId('example-description-input').locator('[contenteditable="true"]')
  }

  get saveButton(): Locator {
    return this.page.getByTestId('example-save-button')
  }

  get backButton(): Locator {
    return this.page.getByTestId('example-editor-back-button')
  }

  async fillAndSave(title: string, description = ''): Promise<void> {
    await this.titleInput.fill(title)
    await this.descriptionInput.fill(description)
    await this.saveButton.click()
    await expect(this.page.getByTestId('examples-page')).toBeVisible({ timeout: 15000 })
  }
}
