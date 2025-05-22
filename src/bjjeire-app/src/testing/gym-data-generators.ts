// import {
//   randCompanyName,
//   randUserName,
//   randEmail,
//   randParagraph,
//   randUuid,
//   randPassword,
//   randCatchPhrase,
// } from '@ngneat/falso';
// import {
//   GymDto,
//   GymStatus,
//   ClassCategory,
//   TrialOfferDto,
//   AffiliationDto,
//   LocationDto,
//   SocialMediaDto,
//   GeoCoordinatesDto,
//   PaginatedResponse,
//   GetGymsByCountyPaginationQuery,
// } from './your-types-file'; // Replace with your actual types file import

// // Helper function to generate a random enum value
// const randEnum = <T>(enumObj: T): T[keyof T] => {
//   const values = Object.values(enumObj) as T[keyof T][];
//   return values[Math.floor(Math.random() * values.length)];
// };

// // Generate fake SocialMediaDto
// const generateSocialMediaDto = () => ({
//   instagram: `https://instagram.com/${randUserName({ withAccents: false })}`,
//   facebook: `https://facebook.com/${randUserName({ withAccents: false })}`,
//   x: `https://x.com/${randUserName({ withAccents: false })}`,
//   youTube: `https://youtube.com/${randUserName({ withAccents: false })}`,
// });

// export const createSocialMediaDto = <T extends Partial<ReturnType<typeof generateSocialMediaDto>>>(
//   overrides?: T,
// ) => {
//   return { ...generateSocialMediaDto(), ...overrides };
// };

// // Generate fake GeoCoordinatesDto
// const generateGeoCoordinatesDto = () => ({
//   type: 'Point' as const,
//   latitude: parseFloat((Math.random() * 180 - 90).toFixed(6)), // Simulate randFloat
//   longitude: parseFloat((Math.random() * 360 - 180).toFixed(6)), // Simulate randFloat
//   placeName: randUserName({ withAccents: false }), // Using randUserName as a substitute for city
//   placeId: randUuid(),
// });

// export const createGeoCoordinatesDto = <T extends Partial<ReturnType<typeof generateGeoCoordinatesDto>>>(
//   overrides?: T,
// ) => {
//   return { ...generateGeoCoordinatesDto(), ...overrides };
// };

// // Generate fake LocationDto
// const generateLocationDto = () => ({
//   address: `${randUserName({ withAccents: false })} Street`, // Simulate address
//   venue: randCompanyName(),
//   coordinates: generateGeoCoordinatesDto(),
// });

// export const createLocationDto = <T extends Partial<ReturnType<typeof generateLocationDto>>>(
//   overrides?: T,
// ) => {
//   return { ...generateLocationDto(), ...overrides };
// };

// // Generate fake TrialOfferDto
// const generateTrialOfferDto = () => {
//   const isAvailable = Math.random() > 0.5; // Simulate randBoolean
//   return {
//     isAvailable,
//     freeClasses: isAvailable ? Math.floor(Math.random() * 5) + 1 : undefined, // Simulate randNumber
//     freeDays: isAvailable ? Math.floor(Math.random() * 24) + 7 : undefined, // Simulate randNumber
//     notes: isAvailable ? randParagraph() : undefined,
//   };
// };

// export const createTrialOfferDto = <T extends Partial<ReturnType<typeof generateTrialOfferDto>>>(
//   overrides?: T,
// ) => {
//   return { ...generateTrialOfferDto(), ...overrides };
// };

// // Generate fake AffiliationDto
// const generateAffiliationDto = () => ({
//   name: randCompanyName(),
//   website: Math.random() > 0.5 ? `https://${randUserName({ withAccents: false })}.com` : undefined,
// });

// export const createAffiliationDto = <T extends Partial<ReturnType<typeof generateAffiliationDto>>>(
//   overrides?: T,
// ) => {
//   return { ...generateAffiliationDto(), ...overrides };
// };

// // Generate fake GymDto
// const generateGymDto = () => ({
//   id: randUuid(),
//   createdOnUtc: new Date(Date.now() - Math.random() * 10000000000).toISOString(), // Simulate randPastDate
//   updatedOnUtc: new Date(Date.now() - Math.random() * 5000000000).toISOString(), // Simulate randPastDate
//   name: `${randUserName({ withAccents: false })} Martial Arts`,
//   description: randParagraph(),
//   status: randEnum(GymStatus),
//   county: randUserName({ withAccents: false }), // Simulate county
//   affiliation: Math.random() > 0.5 ? generateAffiliationDto() : undefined,
//   trialOffer: generateTrialOfferDto(),
//   location: generateLocationDto(),
//   socialMedia: generateSocialMediaDto(),
//   offeredClasses: Array.from(
//     { length: Math.floor(Math.random() * 5) + 1 },
//     () => randEnum(ClassCategory),
//   ),
//   website: Math.random() > 0.5 ? `https://${randUserName({ withAccents: false })}.com` : undefined,
//   timetableUrl: Math.random() > 0.5 ? `https://${randUserName({ withAccents: false })}.com/timetable` : undefined,
//   imageUrl: Math.random() > 0.5 ? `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/200` : undefined,
// });

// export const createGymDto = <T extends Partial<ReturnType<typeof generateGymDto>>>(
//   overrides?: T,
// ) => {
//   return { ...generateGymDto(), ...overrides };
// };

// // Generate fake PaginatedResponse<GymDto>
// const generatePaginatedGymResponse = (query: GetGymsByCountyPaginationQuery) => {
//   const { page, pageSize, county } = query;
//   const totalItems = Math.floor(Math.random() * 91) + 10; // Simulate randNumber({ min: 10, max: 100 })
//   const totalPages = Math.ceil(totalItems / pageSize);
//   const hasNextPage = page < totalPages;
//   const hasPreviousPage = page > 1;

//   return {
//     data: Array.from({ length: pageSize }, () =>
//       generateGymDto(),
//     ).map(gym => ({
//       ...gym,
//       county: county || gym.county, // Respect county filter
//     })),
//     pagination: {
//       totalItems,
//       currentPage: page,
//       pageSize,
//       totalPages,
//       hasNextPage,
//       hasPreviousPage,
//       nextPageUrl: hasNextPage
//         ? `/api/gyms?county=${county || ''}&page=${page + 1}&pageSize=${pageSize}`
//         : null,
//       previousPageUrl: hasPreviousPage
//         ? `/api/gyms?county=${county || ''}&page=${page - 1}&pageSize=${pageSize}`
//         : null,
//     },
//   };
// };

// export const createPaginatedGymResponse = <
//   T extends Partial<ReturnType<typeof generatePaginatedGymResponse>>,
// >(
//   query: GetGymsByCountyPaginationQuery,
//   overrides?: T,
// ) => {
//   return { ...generatePaginatedGymResponse(query), ...overrides };
// };

// // Example usage
// // const query: GetGymsByCountyPaginationQuery = {
// //   county: 'Dublin',
// //   page: 1,
// //   pageSize: 10,
// // };

// // const paginatedResponse = createPaginatedGymResponse(query);
// // console.log(JSON.stringify(paginatedResponse, null, 2));
