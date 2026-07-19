export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
  placeName: string | null;
  placeId: string | null;
}

export interface Affiliation {
  name: string;
  website: string | null;
}

export interface TrialOffer {
  isAvailable: boolean;
  freeClasses: number | null;
  freeDays: number | null;
  notes: string | null;
}

export interface GymLocation {
  address: string;
  venue: string;
  coordinates: GeoPoint;
}

export interface SocialMedia {
  instagram: string | null;
  facebook: string | null;
  x: string | null;
  youTube: string | null;
}

/** Common audit fields on every BaseEntity-derived document. */
export interface Auditable {
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface Gym extends Auditable {
  id: string;
  name: string;
  description: string;
  status: string;
  county: string | null;
  affiliation: Affiliation | null;
  trialOffer: TrialOffer;
  location: GymLocation;
  socialMedia: SocialMedia;
  offeredClasses: string[];
  website: string | null;
  timetableUrl: string | null;
  imageUrl: string | null;
}

export interface BjjEvent extends Auditable {
  id: string;
  name: string;
  description: string;
  status: string;
  date: string | null;
  venue: string | null;
  website: string | null;
}

export interface Competition extends Auditable {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  organisation: string;
  country: string;
  websiteUrl: string;
  registrationUrl: string | null;
  logoUrl: string | null;
  tags: string[];
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

export interface Store extends Auditable {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string;
  logoUrl: string | null;
  isActive: boolean;
}
