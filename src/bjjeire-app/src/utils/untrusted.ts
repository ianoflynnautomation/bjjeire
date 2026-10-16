/** Read a string from API JSON that the DTO type marks as present. */
export function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isPresentArray<T>(
  value: readonly T[] | null | undefined
): value is readonly T[] {
  return Array.isArray(value)
}

/** Read an array from API JSON that the DTO type marks as present. */
export function asArray<T>(value: readonly T[] | null | undefined): T[] {
  if (!isPresentArray(value)) {
    return []
  }
  return value.slice()
}

/** Read one field from an object that the DTO type marks as present. */
export function readField(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) {
    return undefined
  }
  return (value as Record<string, unknown>)[key]
}
