const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** `value` with the given protocol in front, replacing any other protocol it had. */
export function getProtocolValue(value: string | null | undefined, protocol: string): string {
  const trimmed = (value || '').trim()
  const prefix = `${protocol}:`

  if (!trimmed) return prefix
  if (trimmed.toLowerCase().startsWith(prefix)) return trimmed
  return `${prefix}${trimmed.replace(/^\w+:/, '')}`
}

export function stripKnownLinkProtocol(value: string | null | undefined): string {
  return (value || '').trim().replace(/^(tel:|mailto:)/i, '')
}

export function isPhoneLikeValue(value: string | null | undefined): boolean {
  return /^\+?[0-9][0-9()\-\s]{5,}$/.test((value || '').trim())
}

export function normalizePhoneHref(value: string): string {
  const cleaned = (value || '').replace(/[^\d+]/g, '')
  if (!cleaned) return value
  return cleaned.startsWith('+') ? cleaned : cleaned.replace(/\+/g, '')
}

/** Turns links whose target is a bare phone number or email into `tel:` and `mailto:` links. */
export function normalizeMarkdownLinks(markdown: string): string {
  if (!markdown) return markdown

  return markdown.replace(/\[([^\]]*)\]\(([^)\s"]+)(\s+"[^"]*")?\)/g, (match, text: string, href: string, title = '') => {
    const target = (href || '').trim()
    if (!target || /^(https?:|mailto:|tel:|\/|#)/i.test(target)) return match
    if (isPhoneLikeValue(target)) return `[${text}](tel:${normalizePhoneHref(target)}${title})`
    if (EMAIL.test(target)) return `[${text}](mailto:${target}${title})`
    return match
  })
}

/**
 * Markdown reduced to plain text for places that show a short preview, such as a table
 * cell. It drops the common syntax; it is not a parser.
 */
export function markdownToPlainText(markdown: string | null | undefined, maxLength = 0): string {
  // Characters the author escaped are meant literally: set them aside while the syntax is stripped.
  const literals: string[] = []
  const text = (markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\\([\\`*_{}[\]()#+\-.!>~])/g, (_, char: string) => `\uE000${literals.push(char) - 1}\uE001`)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/(\*\*|__|\*|_|~~|`)/g, '')
    .replace(/&#x20;|&nbsp;/g, ' ')
    .replace(/\uE000(\d+)\uE001/g, (_, index: string) => literals[Number(index)])
    .replace(/\s+/g, ' ')
    .trim()
  if (maxLength > 0 && text.length > maxLength) return `${text.slice(0, maxLength).trimEnd()}…`
  return text
}
