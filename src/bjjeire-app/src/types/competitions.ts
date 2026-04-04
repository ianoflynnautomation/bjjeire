import type { BaseApiEntityModel } from './common'

export enum CompetitionOrganisation {
  IBJJF = 'IBJJF',
  NAGA = 'NAGA',
  GrapplingIndustries = 'GrapplingIndustries',
  F2WPro = 'F2WPro',
  ADCC = 'ADCC',
  SJJIF = 'SJJIF',
  Other = 'Other',
}

export const COMPETITION_ORGANISATION_LABELS: Record<
  CompetitionOrganisation,
  string
> = {
  [CompetitionOrganisation.IBJJF]: 'IBJJF',
  [CompetitionOrganisation.NAGA]: 'NAGA',
  [CompetitionOrganisation.GrapplingIndustries]: 'Grappling Industries',
  [CompetitionOrganisation.F2WPro]: 'F2W Pro',
  [CompetitionOrganisation.ADCC]: 'ADCC',
  [CompetitionOrganisation.SJJIF]: 'SJJIF',
  [CompetitionOrganisation.Other]: 'Other',
}

export interface CompetitionDto extends BaseApiEntityModel {
  slug: string
  name: string
  description?: string
  organisation: CompetitionOrganisation
  country: string
  websiteUrl: string
  registrationUrl?: string
  logoUrl?: string
  tags: string[]
  startDate?: string
  endDate?: string
  isActive: boolean
}

export interface GetCompetitionsPaginationQuery {
  page: number
  pageSize: number
  organisation?: CompetitionOrganisation | 'all'
}
