import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '@/api/queryKeys'
import type { ID, PageParams } from '@/api/types'
import { examplesApi } from './api'
import type { ExampleRequest } from './types'

export function useExamples(params: PageParams) {
  return useQuery({
    queryKey: qk.examples.list(params),
    queryFn: () => examplesApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useExample(id: ID | undefined) {
  return useQuery({
    queryKey: qk.examples.detail(id ?? 0),
    queryFn: () => examplesApi.get(id as ID),
    enabled: id != null,
    meta: { silent: true },
  })
}

/** Field errors are shown in the form, so the global error toast is silenced. */
export function useSaveExample() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: ID; body: ExampleRequest }) => (id ? examplesApi.update(id, body) : examplesApi.create(body)),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.examples.all }),
    meta: { silent: true },
  })
}

export function useDeleteExample() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: ID) => examplesApi.remove(id),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.examples.all }),
  })
}
