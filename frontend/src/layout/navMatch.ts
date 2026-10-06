import type { ReactNode } from 'react'
import { hasAnyRole, type Role, type RoleHolder } from '@/auth/roles'

export interface NavItem {
  key: string
  labelKey: string
  icon: ReactNode
  testId: string
  roles: readonly Role[] | 'all'
  path: string
}

type Target = Pick<NavItem, 'key' | 'path'>

export function visibleNav(items: readonly NavItem[], user: RoleHolder | null): NavItem[] {
  return items.filter((item) => item.roles === 'all' || hasAnyRole(user, item.roles))
}

/** The item whose path is the longest prefix of the current location. */
export function selectNavKey(items: readonly Target[], pathname: string): string | undefined {
  let best: { key: string; length: number } | undefined
  for (const item of items) {
    const matches = item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`)
    if (matches && (!best || item.path.length > best.length)) {
      best = { key: item.key, length: item.path.length }
    }
  }
  return best?.key
}

/** Only one of the two menus shows a selected item: the one with the longest match. */
export function selectActiveNav(main: readonly Target[], admin: readonly Target[], pathname: string): { main?: string; admin?: string } {
  const tagged = [
    ...main.map((item) => ({ path: item.path, key: `main:${item.key}` })),
    ...admin.map((item) => ({ path: item.path, key: `admin:${item.key}` })),
  ]
  const active = selectNavKey(tagged, pathname)
  if (!active) return {}
  const split = active.indexOf(':')
  const key = active.slice(split + 1)
  return active.slice(0, split) === 'main' ? { main: key } : { admin: key }
}
