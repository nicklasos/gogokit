import { api } from '@/api/client'
import type { ID, MessageResponse, PageParams } from '@/api/types'
import type { Example, ExampleRequest } from './types'

export const examplesApi = {
  list: (params: PageParams) => api.getPage<Example>('/examples', { query: params }),
  get: (id: ID) => api.get<Example>(`/examples/${id}`),
  create: (body: ExampleRequest) => api.post<Example>('/examples', body),
  update: (id: ID, body: ExampleRequest) => api.put<Example>(`/examples/${id}`, body),
  remove: (id: ID) => api.del<MessageResponse>(`/examples/${id}`),
}
