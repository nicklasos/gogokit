import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatEditorTranslation, isTranslationDomError } from './editorSupport'

describe('formatEditorTranslation', () => {
  it('returns the interpolated default when i18n yields an object', () => {
    const t = () => ({ paragraph: 'Paragraph' })
    assert.equal(formatEditorTranslation(t, 'toolbar.blockTypes.heading', 'Heading {{level}}', { level: 2 }), 'Heading 2')
  })

  it('returns the translated string when i18n succeeds', () => {
    const t = (key: string) => (key === 'editor.toolbar.bold' ? 'Жирний' : key)
    assert.equal(formatEditorTranslation(t, 'toolbar.bold', 'Bold'), 'Жирний')
  })

  it('falls back to the default for a missing key', () => {
    const t = (key: string) => key
    assert.equal(formatEditorTranslation(t, 'toolbar.unknown', 'Fallback'), 'Fallback')
  })
})

describe('isTranslationDomError', () => {
  it('matches the Chrome Translate removeChild error', () => {
    const error = new Error("Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.")
    error.name = 'NotFoundError'
    assert.equal(isTranslationDomError(error), true)
  })

  it('rejects unrelated errors', () => {
    assert.equal(isTranslationDomError(new Error('Lexical update failed')), false)
    assert.equal(isTranslationDomError(undefined), false)
  })
})
