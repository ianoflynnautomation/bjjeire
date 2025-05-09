export const CITIES = ['Cork', 'Dublin', 'all'] as const;
export type City = typeof CITIES[number];