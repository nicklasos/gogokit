import { hasAnyRole, ROLE_ADMIN } from '@/auth/roles'
import type { User } from '@/auth/types'
import type { Example } from './types'

/*
 * Who may do what to an example. These mirror gogo's internal/example/policy.go and only
 * decide what the UI offers: the API enforces the same rules and is the one that counts.
 */

type Actor = User | null

const owns = (user: Actor, example: Example) => user != null && example.user_id === user.id

export const canViewExample = (user: Actor, example: Example) => owns(user, example) || hasAnyRole(user, [ROLE_ADMIN])

/** The owner only: an admin can look at and remove someone's example, not rewrite it. */
export const canUpdateExample = (user: Actor, example: Example) => owns(user, example)

export const canDeleteExample = (user: Actor, example: Example) => owns(user, example) || hasAnyRole(user, [ROLE_ADMIN])
