import { api } from '@/api/client'
import type { ID, MessageResponse, PageParams } from '@/api/types'
import type { UploadedFile } from './types'

export const uploadsApi = {
  list: (params: PageParams) => api.getPage<UploadedFile>('/uploads', { query: params }),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.postForm<UploadedFile>('/uploads', form)
  },
  remove: (id: ID) => api.del<MessageResponse>(`/uploads/${id}`),
}
