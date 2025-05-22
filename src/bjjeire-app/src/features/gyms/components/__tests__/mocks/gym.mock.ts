// // src/components/gyms/__tests__/mocks/gym.mock.ts (or similar path)
// import { GymDto, GymStatus, ClassCategory } from '../../../../types/gyms'; // Adjust path as needed

// export const mockGym: GymDto = {
//   id: 'gym-123',
//   name: 'Elite BJJ Academy',
//   county: 'Dublin',
//   status: GymStatus.Active,
//   location: {
//     address: '123 Main Street, Dublin, D01 A2B3',
//     latitude: 53.3498,
//     longitude: -6.2603,
//     venue: 'Unit 5',
//   },
//   website: 'https://elitebjj.ie',
//   timetableUrl: 'https://elitebjj.ie/timetable',
//   socialMedia: {
//     instagram: 'https://instagram.com/elitebjj',
//     facebook: 'https://facebook.com/elitebjj',
//   },
//   affiliation: {
//     name: 'Global Team BJJ',
//     website: 'https://globalteambjj.com',
//   },
//   offeredClasses: [ClassCategory.GI, ClassCategory.NO_GI, ClassCategory.KIDS],
//   trialOffer: {
//     isAvailable: true,
//     freeClasses: 1,
//     notes: 'First class is on us!',
//   },
//   imageUrl: 'https://example.com/gym_image.jpg',
//   slug: 'elite-bjj-academy',
//   dateCreated: new Date().toISOString(),
//   dateUpdated: new Date().toISOString(),
//   isClaimed: false,
// };

// export const minimalMockGym: GymDto = {
//   id: 'gym-456',
//   name: 'Basic Training Center',
//   county: 'Cork',
//   status: GymStatus.UNVERIFIED,
//   // most other fields are optional and can be omitted for minimal tests
// };