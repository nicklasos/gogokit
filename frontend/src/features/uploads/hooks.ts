import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '@/api/queryKeys'
import type { ID, PageParams } from '@/api/types'
import { uploadsApi } from './api'

export function useUploads(params: PageParams) {
  return useQuery({
    queryKey: qk.uploads.list(params),
    queryFn: () => uploadsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useUploadFile() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadsApi.upload(file),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.uploads.all }),
  })
}

export function useDeleteUpload() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: ID) => uploadsApi.remove(id),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.uploads.all }),
  })
}
