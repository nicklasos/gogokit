import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { EMPTY, formatBytes, formatDateTime, formatNumber, setFormatLanguage } from './format'

const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')

describe('format', () => {
  beforeEach(() => setFormatLanguage('en'))

  it('uses the app language, not the browser', () => {
    assert.equal(plain(formatNumber(1234.5)), '1,234.5')
    setFormatLanguage('uk')
    assert.equal(plain(formatNumber(1234.5)), '1 234,5')
  })

  it('shows a dash for missing values', () => {
    assert.equal(formatNumber(null), EMPTY)
    assert.equal(formatNumber(Number.NaN), EMPTY)
    assert.equal(formatDateTime(null), EMPTY)
    assert.equal(formatBytes(null), EMPTY)
  })

  it('formats a local timestamp', () => {
    assert.equal(formatDateTime('2026-09-11T14:05:00'), '11.09.2026 14:05')
    assert.equal(formatDateTime('not a date'), 'not a date')
  })

  it('formats byte counts in binary units', () => {
    assert.equal(formatBytes(0), '0 B')
    assert.equal(formatBytes(512), '512 B')
    assert.equal(formatBytes(1536), '1.5 KB')
    assert.equal(formatBytes(5 * 1024 * 1024), '5 MB')
  })
})
