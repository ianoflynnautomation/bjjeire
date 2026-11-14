import type { components } from './api'
import type { GymDto } from '@/types/gyms'
import type { BjjEventDto } from '@/types/event'
import type { CompetitionDto } from '@/types/competitions'
import type { StoreDto } from '@/types/stores'
import type {
  DivisionDto,
  TournamentCommand,
  TournamentDto,
  TournamentSummaryDto,
  UpdateTournamentCommand,
} from '@/types/tournaments'

type ApiGymDto = components['schemas']['GymDto']
type ApiBjjEventDto = components['schemas']['BjjEventDto']
type ApiCompetitionDto = components['schemas']['CompetitionDto']
type ApiStoreDto = components['schemas']['StoreDto']
type ApiTournamentDto = components['schemas']['TournamentDto']
type ApiTournamentSummaryDto = components['schemas']['TournamentSummaryDto']
type ApiDivisionDto = components['schemas']['DivisionDto']
type ApiCreateTournament = components['schemas']['CreateTournamentCommand']
type ApiUpdateTournament = components['schemas']['UpdateTournamentCommand']

// A property typed `never` is assignable to `true`, so a mapped `true | never`
// check stays green when the SPA invents a field. Exclude is the check that fails.
type KeysArePublished<Frontend, Api> =
  Exclude<keyof Frontend, keyof Api> extends never ? true : never

type _GymKeyCheck = KeysArePublished<GymDto, ApiGymDto>
type _EventKeyCheck = KeysArePublished<BjjEventDto, ApiBjjEventDto>
type _CompetitionKeyCheck = KeysArePublished<CompetitionDto, ApiCompetitionDto>
type _StoreKeyCheck = KeysArePublished<StoreDto, ApiStoreDto>
type _TournamentKeyCheck = KeysArePublished<TournamentDto, ApiTournamentDto>
type _TournamentSummaryKeyCheck = KeysArePublished<
  TournamentSummaryDto,
  ApiTournamentSummaryDto
>
type _DivisionKeyCheck = KeysArePublished<DivisionDto, ApiDivisionDto>
type _CreateTournamentKeyCheck = KeysArePublished<
  TournamentCommand,
  ApiCreateTournament
>
type _UpdateTournamentKeyCheck = KeysArePublished<
  UpdateTournamentCommand,
  ApiUpdateTournament
>
// The enum wire values the SPA switches on must be the ones the API serves.
type _RegistrationStateMatches =
  TournamentDto['registrationState'] extends NonNullable<
    ApiTournamentDto['registrationState']
  >
    ? true
    : never
type _TournamentStatusMatches =
  TournamentDto['status'] extends NonNullable<ApiTournamentDto['status']>
    ? true
    : never
type _DivisionValuesMatch = [
  DivisionDto['discipline'],
  DivisionDto['gender'],
  DivisionDto['ageCategory'],
  DivisionDto['belt'],
] extends [
  ApiDivisionDto['discipline'],
  ApiDivisionDto['gender'],
  ApiDivisionDto['ageCategory'],
  ApiDivisionDto['belt'],
]
  ? true
  : never
type _PageUrlAllowsNull =
  null extends components['schemas']['PaginationMetadata']['nextPageUrl']
    ? null extends components['schemas']['PaginationMetadata']['previousPageUrl']
      ? true
      : never
    : never

const _gymOk: _GymKeyCheck = true
const _eventOk: _EventKeyCheck = true
const _competitionOk: _CompetitionKeyCheck = true
const _storeOk: _StoreKeyCheck = true
const _tournamentOk: _TournamentKeyCheck = true
const _tournamentSummaryOk: _TournamentSummaryKeyCheck = true
const _divisionOk: _DivisionKeyCheck = true
const _createTournamentOk: _CreateTournamentKeyCheck = true
const _updateTournamentOk: _UpdateTournamentKeyCheck = true
const _registrationStateOk: _RegistrationStateMatches = true
const _tournamentStatusOk: _TournamentStatusMatches = true
const _divisionValuesOk: _DivisionValuesMatch = true
const _pageUrlsOk: _PageUrlAllowsNull = true

export {
  _gymOk,
  _eventOk,
  _competitionOk,
  _storeOk,
  _tournamentOk,
  _tournamentSummaryOk,
  _divisionOk,
  _createTournamentOk,
  _updateTournamentOk,
  _registrationStateOk,
  _tournamentStatusOk,
  _divisionValuesOk,
  _pageUrlsOk,
}
