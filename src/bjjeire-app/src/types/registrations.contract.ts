import type { components } from '@/types/generated/api'
import type {
  AdminCancelCommand,
  AdminRegistrationDto,
  CancellationDto,
  ChangeDivisionCommand,
  CreateRegistrationCommand,
  MergeTeamsCommand,
  TeamMergeDto,
  DivisionCompetitorsDto,
  ListedCompetitorDto,
  RegistrationCheckoutDto,
  RegistrationDto,
} from '@/types/registrations'

type Schemas = components['schemas']

// Exclude, not a mapped `true | never`: a key the SPA invents must fail the build.
type KeysArePublished<Frontend, Api> =
  Exclude<keyof Frontend, keyof Api> extends never ? true : never

type RegistrationKeys = KeysArePublished<
  RegistrationDto,
  Schemas['RegistrationDto']
>
type CheckoutKeys = KeysArePublished<
  RegistrationCheckoutDto,
  Schemas['RegistrationCheckoutDto']
>
type CommandKeys = KeysArePublished<
  CreateRegistrationCommand,
  Schemas['CreateRegistrationCommand']
>
type ListKeys = KeysArePublished<
  DivisionCompetitorsDto,
  Schemas['DivisionCompetitorsDto']
>
type ListedKeys = KeysArePublished<
  ListedCompetitorDto,
  Schemas['ListedCompetitorDto']
>
type StatusValues =
  RegistrationDto['status'] extends NonNullable<
    Schemas['RegistrationDto']['status']
  >
    ? true
    : never
type RefundValues =
  NonNullable<RegistrationDto['refundStatus']> extends NonNullable<
    Schemas['RegistrationDto']['refundStatus']
  >
    ? true
    : never

type CancellationKeys = KeysArePublished<
  CancellationDto,
  Schemas['CancellationDto']
>
type ChangeDivisionKeys = KeysArePublished<
  ChangeDivisionCommand,
  Schemas['ChangeDivisionCommand']
>
type AdminCancelKeys = KeysArePublished<
  AdminCancelCommand,
  Schemas['AdminCancelCommand']
>
type MergeKeys = KeysArePublished<
  MergeTeamsCommand,
  Schemas['MergeTeamsCommand']
>
type MergeResultKeys = KeysArePublished<TeamMergeDto, Schemas['TeamMergeDto']>
type AdminRowKeys = KeysArePublished<
  AdminRegistrationDto,
  Schemas['AdminRegistrationDto']
>

// Separate checks. An intersection of `true` is redundant, and the lint fixer deletes it.
export const registrationsContractOk = [
  true satisfies RegistrationKeys,
  true satisfies CheckoutKeys,
  true satisfies CommandKeys,
  true satisfies ListKeys,
  true satisfies ListedKeys,
  true satisfies StatusValues,
  true satisfies RefundValues,
  true satisfies CancellationKeys,
  true satisfies ChangeDivisionKeys,
  true satisfies AdminCancelKeys,
  true satisfies MergeKeys,
  true satisfies MergeResultKeys,
  true satisfies AdminRowKeys,
] as const
