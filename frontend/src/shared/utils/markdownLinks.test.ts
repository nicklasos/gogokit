import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getProtocolValue,
  isPhoneLikeValue,
  markdownToPlainText,
  normalizeMarkdownLinks,
  normalizePhoneHref,
  stripKnownLinkProtocol,
} from './markdownLinks'

describe('markdown links', () => {
  it('getProtocolValue prefixes empty and bare values', () => {
    assert.equal(getProtocolValue('', 'tel'), 'tel:')
    assert.equal(getProtocolValue('380501112233', 'tel'), 'tel:380501112233')
    assert.equal(getProtocolValue('tel:+380', 'tel'), 'tel:+380')
    assert.equal(getProtocolValue('mailto:a@b.c', 'tel'), 'tel:a@b.c')
  })

  it('stripKnownLinkProtocol removes tel and mailto', () => {
    assert.equal(stripKnownLinkProtocol('tel:+380'), '+380')
    assert.equal(stripKnownLinkProtocol('mailto:a@b.c'), 'a@b.c')
    assert.equal(stripKnownLinkProtocol('plain'), 'plain')
  })

  it('isPhoneLikeValue detects phone-like strings', () => {
    assert.equal(isPhoneLikeValue('+380501112233'), true)
    assert.equal(isPhoneLikeValue('050 111 22 33'), true)
    assert.equal(isPhoneLikeValue('not-a-phone'), false)
    assert.equal(isPhoneLikeValue('a@b.c'), false)
  })

  it('normalizePhoneHref keeps a leading plus and strips other characters', () => {
    assert.equal(normalizePhoneHref('+38 (050) 111-22-33'), '+380501112233')
    assert.equal(normalizePhoneHref('38 050 111'), '38050111')
  })

  it('normalizeMarkdownLinks rewrites bare phone and email targets only', () => {
    assert.equal(normalizeMarkdownLinks('[Call](+380501112233)'), '[Call](tel:+380501112233)')
    assert.equal(normalizeMarkdownLinks('[Mail](user@example.com)'), '[Mail](mailto:user@example.com)')
    assert.equal(normalizeMarkdownLinks('[Web](https://example.com)'), '[Web](https://example.com)')
    assert.equal(normalizeMarkdownLinks('[Already](tel:+380)'), '[Already](tel:+380)')
    assert.equal(normalizeMarkdownLinks('[Page](/examples)'), '[Page](/examples)')
    assert.equal(normalizeMarkdownLinks(''), '')
  })
})

describe('markdownToPlainText', () => {
  it('drops headings, emphasis, lists and link targets', () => {
    const markdown = '## Title\n\nSome **bold** and *italic* text with a [link](https://example.com).\n\n- first\n- second\n\n> quoted'
    assert.equal(markdownToPlainText(markdown), 'Title Some bold and italic text with a link. first second quoted')
  })

  it('unescapes characters the editor escaped', () => {
    assert.equal(markdownToPlainText('1\\. Not a list \\*really\\*'), '1. Not a list *really*')
  })

  it('truncates with an ellipsis', () => {
    assert.equal(markdownToPlainText('one two three four', 7), 'one two…')
    assert.equal(markdownToPlainText('short', 50), 'short')
  })

  it('handles missing input', () => {
    assert.equal(markdownToPlainText(null), '')
    assert.equal(markdownToPlainText(undefined), '')
  })
})
