type Translate = (key: string, defaultValue?: string, interpolations?: Record<string, unknown>) => unknown

/**
 * The editor asks for its labels by key with an English default. A key that is missing
 * from the locales, or that resolves to a group of keys, falls back to that default.
 */
export function formatEditorTranslation(
  translate: Translate,
  key: string,
  defaultValue: string,
  interpolations: Record<string, unknown> = {}
): string {
  const translated = translate(`editor.${key}`, defaultValue, interpolations)
  if (typeof translated === 'string' && translated.length > 0 && !translated.startsWith('editor.')) {
    return translated
  }

  let value = typeof defaultValue === 'string' ? defaultValue : ''
  for (const [name, replacement] of Object.entries(interpolations || {})) {
    value = value.replaceAll(`{{${name}}}`, String(replacement ?? ''))
  }
  return value
}

/**
 * Browser page translation (Chrome Translate) rewrites text nodes under the editor, and
 * React then fails to remove nodes that are no longer where it left them.
 */
export function isTranslationDomError(error: unknown): boolean {
  const { name, message = '' } = (error ?? {}) as { name?: string; message?: string }
  return name === 'NotFoundError' || message.includes("Failed to execute 'removeChild'") || message.includes("Failed to execute 'insertBefore'")
}
