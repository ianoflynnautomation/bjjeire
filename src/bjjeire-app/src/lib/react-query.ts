import type { UseMutationOptions, DefaultOptions } from '@tanstack/react-query'

export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 5 * 60 * 1000,
  },
} satisfies DefaultOptions

type AsyncFn = (...args: readonly unknown[]) => Promise<unknown>
type GenericFn = (...args: readonly unknown[]) => unknown

export type ApiFnReturnType<FnType extends AsyncFn> = Awaited<
  ReturnType<FnType>
>

export type QueryConfig<T extends GenericFn> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>

export type MutationConfig<MutationFnType extends AsyncFn> = UseMutationOptions<
  ApiFnReturnType<MutationFnType>,
  Error,
  Parameters<MutationFnType>[0]
>
