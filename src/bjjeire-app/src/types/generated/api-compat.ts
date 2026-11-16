import type { components } from './api'
import type { GymDto } from '@/types/gyms'
import type { BjjEventDto } from '@/types/event'
import type { CompetitionDto } from '@/types/competitions'
import type { StoreDto } from '@/types/stores'
import type {
  DivisionDto,
  BjjEireCompetitionCommand,
  BjjEireCompetitionDto,
  BjjEireCompetitionSummaryDto,
  UpdateBjjEireCompetitionCommand,
} from '@/types/bjjeire-competitions'

type ApiGymDto = components['schemas']['GymDto']
type ApiBjjEventDto = components['schemas']['BjjEventDto']
type ApiCompetitionDto = components['schemas']['CompetitionDto']
type ApiStoreDto = components['schemas']['StoreDto']
type ApiBjjEireCompetitionDto = components['schemas']['BjjEireCompetitionDto']
type ApiBjjEireCompetitionSummaryDto =
  components['schemas']['BjjEireCompetitionSummaryDto']
type ApiDivisionDto = components['schemas']['DivisionDto']
type ApiCreateBjjEireCompetition =
  components['schemas']['CreateBjjEireCompetitionCommand']
type ApiUpdateBjjEireCompetition =
  components['schemas']['UpdateBjjEireCompetitionCommand']

// A property typed `never` is assignable to `true`, so a mapped `true | never`
// check stays green when the SPA invents a field. Exclude is the check that fails.
type KeysArePublished<Frontend, Api> =
  Exclude<keyof Frontend, keyof Api> extends never ? true : never

type _GymKeyCheck = KeysArePublished<GymDto, ApiGymDto>
type _EventKeyCheck = KeysArePublished<BjjEventDto, ApiBjjEventDto>
type _CompetitionKeyCheck = KeysArePublished<CompetitionDto, ApiCompetitionDto>
type _StoreKeyCheck = KeysArePublished<StoreDto, ApiStoreDto>
type _BjjEireCompetitionKeyCheck = KeysArePublished<
  BjjEireCompetitionDto,
  ApiBjjEireCompetitionDto
>
type _BjjEireCompetitionSummaryKeyCheck = KeysArePublished<
  BjjEireCompetitionSummaryDto,
  ApiBjjEireCompetitionSummaryDto
>
type _DivisionKeyCheck = KeysArePublished<DivisionDto, ApiDivisionDto>
type _CreateBjjEireCompetitionKeyCheck = KeysArePublished<
  BjjEireCompetitionCommand,
  ApiCreateBjjEireCompetition
>
type _UpdateBjjEireCompetitionKeyCheck = KeysArePublished<
  UpdateBjjEireCompetitionCommand,
  ApiUpdateBjjEireCompetition
>
// The enum wire values the SPA switches on must be the ones the API serves.
type _RegistrationStateMatches =
  BjjEireCompetitionDto['registrationState'] extends NonNullable<
    ApiBjjEireCompetitionDto['registrationState']
  >
    ? true
    : never
type _BjjEireCompetitionStatusMatches =
  BjjEireCompetitionDto['status'] extends NonNullable<
    ApiBjjEireCompetitionDto['status']
  >
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
const _bjjEireCompetitionOk: _BjjEireCompetitionKeyCheck = true
const _bjjEireCompetitionSummaryOk: _BjjEireCompetitionSummaryKeyCheck = true
const _divisionOk: _DivisionKeyCheck = true
const _createBjjEireCompetitionOk: _CreateBjjEireCompetitionKeyCheck = true
const _updateBjjEireCompetitionOk: _UpdateBjjEireCompetitionKeyCheck = true
const _registrationStateOk: _RegistrationStateMatches = true
const _bjjEireCompetitionStatusOk: _BjjEireCompetitionStatusMatches = true
const _divisionValuesOk: _DivisionValuesMatch = true
const _pageUrlsOk: _PageUrlAllowsNull = true

export {
  _gymOk,
  _eventOk,
  _competitionOk,
  _storeOk,
  _bjjEireCompetitionOk,
  _bjjEireCompetitionSummaryOk,
  _divisionOk,
  _createBjjEireCompetitionOk,
  _updateBjjEireCompetitionOk,
  _registrationStateOk,
  _bjjEireCompetitionStatusOk,
  _divisionValuesOk,
  _pageUrlsOk,
}
