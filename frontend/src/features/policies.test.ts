import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { User } from '@/auth/types'
import { canDeleteExample, canUpdateExample, canViewExample } from './examples/policy'
import type { Example } from './examples/types'
import { canDeleteUser, canManageUser } from './users/policy'

const person = (id: number, ...roles: string[]): User => ({ id, roles, email: `u${id}@example.com`, name: `User ${id}`, email_verified: true })

const owner = person(1, 'user')
const stranger = person(2, 'user')
const admin = person(3, 'admin')
const superAdmin = person(4, 'super-admin')

describe('examples policy', () => {
  const example = { id: 10, user_id: owner.id } as Example

  it('matches the backend rules', () => {
    const cases: [string, User | null, boolean, boolean, boolean][] = [
      ['owner', owner, true, true, true],
      ['another user', stranger, false, false, false],
      ['admin', admin, true, false, true],
      ['super admin', superAdmin, true, false, true],
      ['signed out', null, false, false, false],
    ]
    for (const [name, user, view, update, remove] of cases) {
      assert.equal(canViewExample(user, example), view, `${name}: view`)
      assert.equal(canUpdateExample(user, example), update, `${name}: update`)
      assert.equal(canDeleteExample(user, example), remove, `${name}: delete`)
    }
  })
})

describe('users policy', () => {
  it('lets a super admin manage everyone and an admin only plain users', () => {
    assert.equal(canManageUser(superAdmin, { roles: ['super-admin'] }), true)
    assert.equal(canManageUser(superAdmin, { roles: ['admin'] }), true)
    assert.equal(canManageUser(admin, { roles: ['user'] }), true)
    assert.equal(canManageUser(admin, { roles: ['admin'] }), false)
    assert.equal(canManageUser(admin, { roles: ['user', 'admin'] }), false)
    assert.equal(canManageUser(admin, { roles: [] }), false)
    assert.equal(canManageUser(owner, { roles: ['user'] }), false)
    assert.equal(canManageUser(null, { roles: ['user'] }), false)
  })

  it('never offers deleting your own account', () => {
    assert.equal(canDeleteUser(superAdmin, { id: superAdmin.id, roles: ['super-admin'] }), false)
    assert.equal(canDeleteUser(superAdmin, { id: 99, roles: ['super-admin'] }), true)
    assert.equal(canDeleteUser(admin, { id: 99, roles: ['admin'] }), false)
  })
})
