/**
 * Display formatting for numbers and dates.
 * The locale follows the app language (`setFormatLanguage`, called by i18n), never the browser.
 * Every formatter returns `—` for a missing value, never 0.
 */

export const EMPTY = '—'
type Lang = 'uk' | 'en'

const LOCALES: Record<Lang, string> = { uk: 'uk-UA', en: 'en-GB' }

let lang: Lang = 'en'

export function setFormatLanguage(language: string | undefined): void {
  lang = language?.startsWith('uk') ? 'uk' : 'en'
}

const missing = (value: number | null | undefined): value is null | undefined => value == null || !Number.isFinite(value)

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (missing(value)) return EMPTY
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: digits }).format(value)
}

/** A timestamp in local time: "11.09.2026 14:05". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return EMPTY
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** A byte count in binary units: "512 B", "1.5 KB", "3.2 MB". */
export function formatBytes(bytes: number | null | undefined): string {
  if (missing(bytes)) return EMPTY
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${formatNumber(value, unit === 0 ? 0 : 1)} ${units[unit]}`
}
