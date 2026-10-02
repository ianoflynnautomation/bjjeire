import type { components } from './api'
import type { GymDto } from '@/types/gyms'
import type { BjjEventDto } from '@/types/event'
import type { CompetitionDto } from '@/types/competitions'
import type { StoreDto } from '@/types/stores'

type ApiGymDto = components['schemas']['GymDto']
type ApiBjjEventDto = components['schemas']['BjjEventDto']
type ApiCompetitionDto = components['schemas']['CompetitionDto']
type ApiStoreDto = components['schemas']['StoreDto']

// A property typed `never` is assignable to `true`, so a mapped `true | never`
// check stays green when the SPA invents a field. Exclude is the check that fails.
type KeysArePublished<Frontend, Api> =
  Exclude<keyof Frontend, keyof Api> extends never ? true : never

type _GymKeyCheck = KeysArePublished<GymDto, ApiGymDto>
type _EventKeyCheck = KeysArePublished<BjjEventDto, ApiBjjEventDto>
type _CompetitionKeyCheck = KeysArePublished<CompetitionDto, ApiCompetitionDto>
type _StoreKeyCheck = KeysArePublished<StoreDto, ApiStoreDto>
type _PageUrlAllowsNull = null extends components['schemas']['PaginationMetadata']['nextPageUrl']
  ? null extends components['schemas']['PaginationMetadata']['previousPageUrl']
    ? true
    : never
  : never

const _gymOk: _GymKeyCheck = true
const _eventOk: _EventKeyCheck = true
const _competitionOk: _CompetitionKeyCheck = true
const _storeOk: _StoreKeyCheck = true
const _pageUrlsOk: _PageUrlAllowsNull = true

export { _gymOk, _eventOk, _competitionOk, _storeOk, _pageUrlsOk }
