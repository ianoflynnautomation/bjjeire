import type { components } from './api'
import type { GymDto } from '@/types/gyms'
import type { BjjEventDto } from '@/types/event'
import type { CompetitionDto } from '@/types/competitions'

type ApiGymDto = components['schemas']['GymDto']
type ApiBjjEventDto = components['schemas']['BjjEventDto']
type ApiCompetitionDto = components['schemas']['CompetitionDto']

// Structural check: every key the frontend expects must exist in the API schema.
// Catches field renames/removals without failing on enum representation diffs.
// If a key is missing from the API, the mapped type produces `never` and the
// assignment to Record<string, true> fails.
type KeysExist<Api, Frontend> = {
  [K in keyof Frontend]: K extends keyof Api ? true : never
}

// socialMedia shape is loosely typed in the API (additionalProperties), so omit it.
type _GymKeyCheck = KeysExist<ApiGymDto, Omit<GymDto, 'socialMedia'>>
type _EventKeyCheck = KeysExist<
  ApiBjjEventDto,
  Omit<BjjEventDto, 'socialMedia'>
>
type _CompetitionKeyCheck = KeysExist<ApiCompetitionDto, CompetitionDto>

// If a frontend key doesn't exist in the API schema, this line will error:
// "Type 'never' is not assignable to type 'true'"
type _AssertGym = _GymKeyCheck extends Record<string, true> ? true : never
type _AssertEvent = _EventKeyCheck extends Record<string, true> ? true : never
type _AssertCompetition =
  _CompetitionKeyCheck extends Record<string, true> ? true : never

// Ensure the assertions resolve to true at compile time
const _gymOk: _AssertGym = true
const _eventOk: _AssertEvent = true
const _competitionOk: _AssertCompetition = true

export { _gymOk, _eventOk, _competitionOk }
