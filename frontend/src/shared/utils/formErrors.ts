import type { FormInstance } from 'antd'
import { isApiError } from '@/api/errors'
import { errorMessage, splitFieldErrors, type Translate } from './serverErrors'

interface Options {
  /** Errors that are not validation errors but belong to one field, by error key: `{ 'auth.user_exists': 'email' }`. */
  keyFields?: Record<string, string>
}

/**
 * Puts a failed save onto a form. Errors for the given fields are shown under those
 * fields. Returns the message for whatever could not be placed on a field, or null when
 * everything was, so the caller decides where that message goes (an alert, a toast).
 */
export function applyFormErrors<Values>(
  form: FormInstance<Values>,
  t: Translate,
  error: unknown,
  fields: readonly string[],
  { keyFields = {} }: Options = {}
): string | null {
  const { fields: fieldErrors, other } = splitFieldErrors(t, error, fields)

  const keyField = isApiError(error) ? keyFields[error.errorKey] : undefined
  if (keyField) fieldErrors.push({ name: keyField, errors: [errorMessage(t, error)] })

  if (fieldErrors.length) form.setFields(fieldErrors as Parameters<typeof form.setFields>[0])
  if (other.length) return other.join(' ')
  return fieldErrors.length ? null : errorMessage(t, error)
}
