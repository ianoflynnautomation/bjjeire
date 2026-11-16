/** Every competition, drafts included, as the organiser's list shows them. */
export const ADMIN_BJJEIRE_COMPETITIONS_KEY = [
  'admin-bjjeire-competitions',
] as const
/** The organiser's sign-up list of one competition, all pages. */
export const adminRegistrationsKey = (id: string) =>
  ['admin-bjjeire-competition-registrations', id] as const
