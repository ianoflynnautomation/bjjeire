import { COUNTIES } from '@/constants/counties'

const ALL_COUNTIES_VALUE = 'all'

export function getCountyDisplayLabel(
  county: string | undefined
): string | undefined {
  if (!county || county.toLowerCase() === ALL_COUNTIES_VALUE) {
    return undefined
  }
  return COUNTIES.find(c => (c.value as string) === county)?.label ?? county
}
