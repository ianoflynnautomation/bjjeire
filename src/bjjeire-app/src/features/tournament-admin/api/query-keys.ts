/** Every tournament, drafts included, as the organiser's list shows them. */
export const ADMIN_TOURNAMENTS_KEY = ['admin-tournaments'] as const
/** The organiser's sign-up list of one tournament, all pages. */
export const adminRegistrationsKey = (id: string) =>
  ['admin-tournament-registrations', id] as const
