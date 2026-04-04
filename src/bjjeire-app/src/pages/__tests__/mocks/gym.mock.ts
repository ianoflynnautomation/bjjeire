import type { GymDto, AffiliationDto, TrialOfferDto } from '@/types/gyms'
import { GymStatus, ClassCategory } from '@/types/gyms'
import type {
  LocationDto,
  SocialMediaDto,
  GeoCoordinatesDto,
} from '@/types/common'

const mockCoordinates: GeoCoordinatesDto = {
  type: 'Point',
  coordinates: [-6.260273, 53.349805],
  latitude: 53.349805,
  longitude: -6.260273,
  placeName: 'Dublin City Center',
  placeId: 'ChIJL6wn6oAOZ0gRoHEx_fI9oXs',
}

const mockLocation: LocationDto = {
  address: '123 Main Street, Dublin, D01 A2B3',
  venue: 'Unit 5, Business Park',
  coordinates: mockCoordinates,
}

const mockSocialMedia: SocialMediaDto = {
  instagram: 'https://instagram.com/testgym',
  facebook: 'https://facebook.com/testgym',
  x: 'https://x.com/testgym',
  youTube: 'https://youtube.com/testgym',
}

const mockAffiliation: AffiliationDto = {
  name: 'Global BJJ Federation',
  website: 'https://globalbjj.com',
}

const mockTrialOfferAvailable: TrialOfferDto = {
  isAvailable: true,
  freeClasses: 1,
  freeDays: 0,
  notes: 'Your first class is on us!',
}

const mockTrialOfferUnavailable: TrialOfferDto = {
  isAvailable: false,
}

export const MOCK_GYM_FULL: GymDto = {
  id: 'gym-id-123',
  name: 'Elite Fighters Academy',
  description: 'Top-tier BJJ and MMA training facility.',
  status: GymStatus.Active,
  county: 'Dublin',
  affiliation: mockAffiliation,
  trialOffer: mockTrialOfferAvailable,
  location: mockLocation,
  socialMedia: mockSocialMedia,
  offeredClasses: [
    ClassCategory.BJJGiAllLevels,
    ClassCategory.KidsBJJ,
    ClassCategory.Wrestling,
  ],
  website: 'https://elitefighters.ie',
  timetableUrl: 'https://elitefighters.ie/timetable',
  imageUrl: 'https://example.com/images/elite_gym.jpg',
  createdOnUtc: new Date().toISOString(),
  updatedOnUtc: new Date().toISOString(),
}

export const MOCK_GYM_MINIMAL: GymDto = {
  id: '17f3dd8e19ad9a1bf21128a3',
  name: 'Community BJJ Club',
  status: GymStatus.PendingApproval,
  county: 'Cork',
  trialOffer: mockTrialOfferUnavailable,
  location: {
    address: '456 Side Street, Cork',
    venue: 'Community Hall',
    coordinates: {
      type: 'Point',
      coordinates: [-8.4863, 51.8969],
      latitude: 51.8969,
      longitude: -8.4863,
    },
  },
  socialMedia: {
    instagram: '',
    facebook: '',
    x: '',
    youTube: '',
  },
  offeredClasses: [],
}

export const MOCK_GYM_NO_WEBSITE: GymDto = {
  ...MOCK_GYM_FULL,
  id: '17f3dd8e19ad9a1bf21128a3',
  website: undefined,
  timetableUrl: undefined,
}
