/**
 * How long the browser treats a merch read as fresh. Shorter than the app's
 * five-minute default: stock, price and visibility changes must show on Shop
 * within a minute (SC-006), and the API's merch cache already takes up to 30
 * seconds on a replica the write did not reach.
 */
export const MERCH_STALE_TIME_MS = 30_000
