import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { selectActiveNav, selectNavKey, visibleNav, type NavItem } from './navMatch'

const items: NavItem[] = [
  { key: 'home', labelKey: '', icon: null, testId: '', roles: 'all', path: '/' },
  { key: 'examples', labelKey: '', icon: null, testId: '', roles: 'all', path: '/examples' },
  { key: 'users', labelKey: '', icon: null, testId: '', roles: ['admin'], path: '/users' },
]

describe('visibleNav', () => {
  it('filters by role', () => {
    assert.deepEqual(visibleNav(items, { roles: ['user'] }).map((i) => i.key), ['home', 'examples'])
    assert.deepEqual(visibleNav(items, { roles: ['admin'] }).map((i) => i.key), ['home', 'examples', 'users'])
  })

  it('shows everything to a super admin', () => {
    assert.equal(visibleNav(items, { roles: ['super-admin'] }).length, 3)
  })

  it('keeps only public items without a user', () => {
    assert.deepEqual(visibleNav(items, null).map((i) => i.key), ['home', 'examples'])
  })
})

describe('selectNavKey', () => {
  it('matches the root only exactly', () => {
    assert.equal(selectNavKey(items, '/'), 'home')
    assert.equal(selectNavKey(items, '/profile'), undefined)
  })

  it('matches nested paths', () => {
    assert.equal(selectNavKey(items, '/examples/12/edit'), 'examples')
  })

  it('does not match a path that only shares a prefix', () => {
    assert.equal(selectNavKey(items, '/examples-archive'), undefined)
  })

  it('picks the longest matching prefix', () => {
    const nested = [
      { key: 'admin', path: '/admin' },
      { key: 'admins', path: '/admin/admins' },
    ]
    assert.equal(selectNavKey(nested, '/admin/admins'), 'admins')
  })
})

describe('selectActiveNav', () => {
  const admin = [{ key: 'admins', path: '/admin/admins' }]

  it('selects in one menu only', () => {
    assert.deepEqual(selectActiveNav(items, admin, '/users'), { main: 'users' })
    assert.deepEqual(selectActiveNav(items, admin, '/admin/admins'), { admin: 'admins' })
  })

  it('selects nothing for an unknown path', () => {
    assert.deepEqual(selectActiveNav(items, admin, '/profile'), {})
  })
})
