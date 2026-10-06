import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FormInstance } from 'antd'
import { ApiError } from '@/api/errors'
import { applyFormErrors } from './formErrors'

const t = (key: string, options?: Record<string, unknown>) => (options?.defaultValue as string | undefined) ?? key

function fakeForm() {
  const calls: { name: string; errors: string[] }[][] = []
  const form = { setFields: (fields: { name: string; errors: string[] }[]) => calls.push(fields) } as unknown as FormInstance
  return { form, calls }
}

describe('applyFormErrors', () => {
  it('places validation errors on their fields and reports nothing else', () => {
    const { form, calls } = fakeForm()
    const error = new ApiError(400, 'validation.failed', 'invalid', { title: ['validation.title.required'] })

    assert.equal(applyFormErrors(form, t, error, ['title', 'description']), null)
    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0].map((f) => f.name), ['title'])
  })

  it('returns the errors of fields the form does not have', () => {
    const { form, calls } = fakeForm()
    const error = new ApiError(400, 'validation.failed', 'invalid', { title: ['validation.title.required'], owner_id: ['validation.owner_id.required'] })

    const unplaced = applyFormErrors(form, t, error, ['title'])
    assert.equal(typeof unplaced, 'string')
    assert.notEqual(unplaced, '')
    assert.deepEqual(calls[0].map((f) => f.name), ['title'])
  })

  it('returns the message of an error that has no field', () => {
    const { form, calls } = fakeForm()
    const error = new ApiError(403, 'users.forbidden_role', 'Not allowed')

    assert.equal(applyFormErrors(form, t, error, ['title']), 'Not allowed')
    assert.equal(calls.length, 0)
  })

  it('puts a known error key on the field it is about', () => {
    const { form, calls } = fakeForm()
    const error = new ApiError(400, 'auth.user_exists', 'Email taken')

    assert.equal(applyFormErrors(form, t, error, ['name', 'email'], { keyFields: { 'auth.user_exists': 'email' } }), null)
    assert.deepEqual(calls[0], [{ name: 'email', errors: ['Email taken'] }])
  })

  it('falls back to a generic message for a non-API error', () => {
    const { form } = fakeForm()
    assert.equal(applyFormErrors(form, t, new Error('boom'), ['title']), 'errors.fallback')
  })
})
