
// Enum for ClassCategory
export enum ClassCategory {
    Uncategorized = 'Uncategorized',
    BJJGiAllLevels = 'BJJGiAllLevels',
    BJJNoGiAllLevels = 'BJJNoGiAllLevels',
    WomensOnly = 'WomensOnly',
    Wrestling = 'Wrestling',
    MuayThai = 'MuayThai',
    Boxing = 'Boxing',
    StrengthTraining = 'StrengthTraining',
    YogaOrPilates = 'YogaOrPilates',
    KidsBJJ = 'KidsBJJ',
    BJJGiFundamentals = 'BJJGiFundamentals',
    BJJGiAdvanced = 'BJJGiAdvanced',
    BJJNoGiFundamentals = 'BJJNoGiFundamentals',
    BJJNoGiAdvanced = 'BJJNoGiAdvanced',
    CompetitionTraining = 'CompetitionTraining',
    ProTraining = 'ProTraining',
    Other = 'Other',
  }
  
  // Enum for GymStatus
  export enum GymStatus {
    Active = 'Active',
    PendingApproval = 'PendingApproval',
    TemporarilyClosed = 'TemporarilyClosed',
    PermanentlyClosed = 'PermanentlyClosed',
    OpeningSoon = 'OpeningSoon',
    Draft = 'Draft',
    Rejected = 'Rejected',
  }
  
  export interface BaseApiEntityModel {
    id?: string;
    createdAt?: string; // ISO date string (e.g., "2025-05-13T14:03:00Z")
    updatedAt?: string;
  }
  
  // GeoCoordinatesDto
  export interface GeoCoordinatesDto {
    type: string; // e.g., "Point"
    latitude: number;
    longitude: number;
    placeName?: string;
    placeId?: string;
  }
  
  // LocationDto
  export interface LocationDto {
    address: string;
    venue: string;
    coordinates: GeoCoordinatesDto;
  }
  
  // TrialOfferDto
  export interface TrialOfferDto {
    isAvailable: boolean;
    freeClasses?: number;
    freeDays?: number;
    notes?: string;
  }
  
  // AffiliationDto
  export interface AffiliationDto {
    name: string;
    website?: string;
  }
  
  // SocialMediaDto
  export interface SocialMediaDto {
    instagram: string;
    facebook: string;
    x: string;
    youTube: string;
  }
  
  // GymDto
  export interface GymDto extends BaseApiEntityModel {
    name: string;
    description?: string;
    status: GymStatus;
    county: string;
    affiliation?: AffiliationDto;
    trialOffer: TrialOfferDto;
    location: LocationDto;
    socialMedia: SocialMediaDto;
    offeredClasses: ClassCategory[];
    website?: string;
    timetableUrl?: string;
    imageUrl?: string;
  }

    export interface GetGymsByCityPaginationQuery {
    county: string;
    page?: number; 
    pageSize?: number;
  }