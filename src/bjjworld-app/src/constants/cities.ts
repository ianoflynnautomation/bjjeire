export const CITIES = ['Cork', 'Dublin'] as const;

export type City = typeof CITIES[number];

