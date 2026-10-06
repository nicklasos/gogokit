import type { ID, PageParams } from './types'

/**
 * Query keys are hierarchical tuples, so invalidating a prefix (`qk.examples.all`)
 * invalidates every list and detail under it.
 */
export const qk = {
  examples: {
    all: ['examples'] as const,
    list: (params: PageParams) => ['examples', 'list', params] as const,
    detail: (id: ID) => ['examples', 'detail', id] as const,
  },
  uploads: {
    all: ['uploads'] as const,
    list: (params: PageParams) => ['uploads', 'list', params] as const,
  },
  users: {
    all: ['users'] as const,
    list: (role: string, params: PageParams) => ['users', 'list', role, params] as const,
  },
}
