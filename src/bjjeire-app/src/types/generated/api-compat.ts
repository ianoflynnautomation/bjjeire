import type { components } from './api'
import type { GymDto } from '@/types/gyms'
import type { BjjEventDto } from '@/types/event'
import type { CompetitionDto } from '@/types/competitions'
import type { StoreDto } from '@/types/stores'

type ApiGymDto = components['schemas']['GymDto']
type ApiBjjEventDto = components['schemas']['BjjEventDto']
type ApiCompetitionDto = components['schemas']['CompetitionDto']
type ApiStoreDto = components['schemas']['StoreDto']

type KeysExist<Api, Frontend> = {
  [K in keyof Frontend]: K extends keyof Api ? true : never
}

type _GymKeyCheck = KeysExist<ApiGymDto, Omit<GymDto, 'socialMedia'>>
type _EventKeyCheck = KeysExist<
  ApiBjjEventDto,
  Omit<BjjEventDto, 'socialMedia'>
>
type _CompetitionKeyCheck = KeysExist<ApiCompetitionDto, CompetitionDto>
type _StoreKeyCheck = KeysExist<ApiStoreDto, StoreDto>

type _AssertGym = _GymKeyCheck extends Record<string, true> ? true : never
type _AssertEvent = _EventKeyCheck extends Record<string, true> ? true : never
type _AssertCompetition =
  _CompetitionKeyCheck extends Record<string, true> ? true : never
type _AssertStore = _StoreKeyCheck extends Record<string, true> ? true : never

const _gymOk: _AssertGym = true
const _eventOk: _AssertEvent = true
const _competitionOk: _AssertCompetition = true
const _storeOk: _AssertStore = true

export { _gymOk, _eventOk, _competitionOk, _storeOk }
