import type { components } from '@/types/generated/api'
import type {
  AdminDivisionResultDto,
  DivisionResultDto,
  LeaderboardDto,
  MedallistDto,
  PodiumDto,
  RecordResultCommand,
  ResultCompetitorDto,
  TeamStandingDto,
  WinnersDto,
} from '@/types/bjjeire-competitions'

type Schemas = components['schemas']

// Exclude, not a mapped `true | never`: a key the SPA invents must fail the build.
type KeysArePublished<Frontend, Api> =
  Exclude<keyof Frontend, keyof Api> extends never ? true : never

type LeaderboardKeys = KeysArePublished<
  LeaderboardDto,
  Schemas['LeaderboardDto']
>
type PodiumKeys = KeysArePublished<PodiumDto, Schemas['PodiumDto']>
type MedallistKeys = KeysArePublished<MedallistDto, Schemas['MedallistDto']>
type StandingKeys = KeysArePublished<
  TeamStandingDto,
  Schemas['TeamStandingDto']
>
type WinnersKeys = KeysArePublished<WinnersDto, Schemas['WinnersDto']>
type ResultKeys = KeysArePublished<
  DivisionResultDto,
  Schemas['DivisionResultDto']
>
type ResultCompetitorKeys = KeysArePublished<
  ResultCompetitorDto,
  Schemas['ResultCompetitorDto']
>
type AdminResultKeys = KeysArePublished<
  AdminDivisionResultDto,
  Schemas['AdminDivisionResultDto']
>
type RecordKeys = KeysArePublished<
  RecordResultCommand,
  Schemas['RecordResultCommand']
>

// Separate checks. An intersection of `true` is redundant, and the lint fixer deletes it.
export const resultsContractOk = [
  true satisfies LeaderboardKeys,
  true satisfies PodiumKeys,
  true satisfies MedallistKeys,
  true satisfies StandingKeys,
  true satisfies WinnersKeys,
  true satisfies ResultKeys,
  true satisfies ResultCompetitorKeys,
  true satisfies AdminResultKeys,
  true satisfies RecordKeys,
] as const
