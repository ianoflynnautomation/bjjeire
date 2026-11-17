import type {
  DivisionResultDto,
  RecordResultCommand,
} from '@/types/bjjeire-competitions'

/** One podium as the organiser edits it: sign-up ids, `''` for nobody. */
export interface ResultFormValues {
  gold: string
  silver: string
  bronzes: [string, string]
}

export type ResultFormCheck =
  { command: RecordResultCommand } | { error: 'needsGold' | 'duplicate' }

export function toResultFormValues(
  result: DivisionResultDto | null | undefined
): ResultFormValues {
  const bronzes = result?.bronzeRegistrationIds ?? []
  return {
    gold: result?.goldRegistrationId ?? '',
    silver: result?.silverRegistrationId ?? '',
    bronzes: [bronzes[0] ?? '', bronzes[1] ?? ''],
  }
}

/** The API's rules, checked first so the organiser is told before saving (FR-031). */
export function toRecordResultCommand(
  values: ResultFormValues
): ResultFormCheck {
  if (values.gold === '') {
    return { error: 'needsGold' }
  }
  const bronzes = values.bronzes.filter(id => id !== '')
  const named = [values.gold, values.silver, ...bronzes].filter(id => id !== '')
  if (new Set(named).size !== named.length) {
    return { error: 'duplicate' }
  }
  return {
    command: {
      goldRegistrationId: values.gold,
      silverRegistrationId: values.silver === '' ? null : values.silver,
      bronzeRegistrationIds: bronzes,
    },
  }
}
