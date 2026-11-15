/** Everything cached for the signed-in competitor; removed on sign-out. */
export const COMPETITOR_KEY = ['competitor'] as const
export const OWN_PROFILE_KEY = [...COMPETITOR_KEY, 'profile'] as const
export const OWN_HISTORY_KEY = [...COMPETITOR_KEY, 'history'] as const
export const DIRECTORY_GYMS_KEY = ['directory-gyms'] as const
