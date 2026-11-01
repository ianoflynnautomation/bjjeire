import { readString } from '@/utils/untrusted'

function normaliseSearchText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/** Ignores case and accents, so `lotus` finds `Lótus` and `bru` finds `Brú`. */
export function textMatchesSearch(value: unknown, term: string): boolean {
  return normaliseSearchText(readString(value)).includes(
    normaliseSearchText(term)
  )
}
