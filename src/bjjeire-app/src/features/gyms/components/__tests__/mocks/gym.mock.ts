import type { GymDto } from '@/types/gyms'
import { GymStatus, ClassCategory } from '@/types/gyms'
import { createGym } from '@/testing/factories/gym.factory'

export const MOCK_GYM_FULL: GymDto = createGym({
  id: 'gym-id-123',
  name: 'Elite Fighters Academy',
  description: 'Top-tier BJJ and MMA training facility.',
  status: GymStatus.Active,
  county: 'Dublin',
  affiliation: {
    name: 'Global BJJ Federation',
    website: 'https://globalbjj.com',
  },
  trialOffer: {
    isAvailable: true,
    freeClasses: 1,
    freeDays: 0,
    notes: 'Your first class is on us!',
  },
  location: {
    address: '123 Main Street, Dublin, D01 A2B3',
    venue: 'Unit 5, Business Park',
    coordinates: {
      type: 'Point',
      coordinates: [-6.260273, 53.349805],
      latitude: 53.349805,
      longitude: -6.260273,
      placeName: 'Dublin City Center',
      placeId: 'ChIJL6wn6oAOZ0gRoHEx_fI9oXs',
    },
  },
  socialMedia: {
    instagram: 'https://instagram.com/testgym',
    facebook: 'https://facebook.com/testgym',
    x: 'https://x.com/testgym',
    youTube: 'https://youtube.com/testgym',
  },
  offeredClasses: [
    ClassCategory.BJJGiAllLevels,
    ClassCategory.KidsBJJ,
    ClassCategory.Wrestling,
  ],
  website: 'https://elitefighters.ie',
  timetableUrl: 'https://elitefighters.ie/timetable',
  imageUrl: 'https://example.com/images/elite_gym.jpg',
  thumbnailUrl: 'https://example.com/images/elite_gym_thumb.jpg',
  createdOnUtc: '2026-01-01T00:00:00.000Z',
  updatedOnUtc: '2026-01-01T00:00:00.000Z',
})

export const MOCK_GYM_MINIMAL: GymDto = createGym({
  id: '17f3dd8e19ad9a1bf21128a3',
  name: 'Community BJJ Club',
  status: GymStatus.PendingApproval,
  county: 'Cork',
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
})

export const MOCK_GYM_NO_WEBSITE: GymDto = createGym({
  ...MOCK_GYM_FULL,
  id: '17f3dd8e19ad9a1bf21128a3',
  website: undefined,
  timetableUrl: undefined,
})
