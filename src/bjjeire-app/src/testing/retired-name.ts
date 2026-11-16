/**
 * The word BJJ Éire competitions were called before ADR-0015. Tests use it to
 * prove nothing visible or routable still carries it (#3011, #3016). This is
 * its only occurrence in the SPA, on purpose.
 */
export const RETIRED_NAME = 'tournament'

export const RETIRED_NAME_PATTERN = new RegExp(RETIRED_NAME, 'i')
