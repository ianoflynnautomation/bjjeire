// import { BaseApiEntityModel } from "./common";

//   export interface GymOpeningHoursDto {
//     day: string;
//     openTime: string;
//     closeTime: string; 
//   }
  
//   export interface GymLocationDto {
//     address: string;
//     city: string;
//     country: string;
//     postalCode?: string;
//   }
  
//   export interface GeoCoordinatesDto {
//     type: string;
//     coordinates?: [number, number];
//   }
  
//   export interface ContactDto {
//     contactPerson: string; 
//     phone?: string;
//     email?: string;
//     website?: string;
//     socialMedia?: Record<string, string>; 
//   }
  
//   export interface GymDto extends BaseApiEntityModel {
//     name: string;
//     description: string;
//     openingHours: GymOpeningHoursDto[];
//     address: GymLocationDto;
//     coordinates?: GeoCoordinatesDto;
//     contact: ContactDto;
//     imageUrl?: string;
//   }

//   export interface GetGymsByCityPaginationQuery {
//     city: string;
//     page?: number; 
//     pageSize?: number;
//   }
  