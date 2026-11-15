import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import { getGyms } from '@/features/gyms/api/get-gyms'
import type {
  CompetitorDto,
  CompetitorHistoryDto,
  SaveCompetitorCommand,
} from '@/types/competitor'
import type { GymDto } from '@/types/gyms'

const ME = `${API_RESOURCE_ROUTES.competitor}/me`

/** The API's largest page, and a ceiling well above the directory's size. */
const GYM_PAGE_SIZE = 100
const MAX_GYM_PAGES = 10

export const getOwnProfile = (): Promise<CompetitorDto> => api.get(ME)

export const saveOwnProfile = (
  command: SaveCompetitorCommand
): Promise<CompetitorDto> => api.put(ME, command)

export const getOwnHistory = (): Promise<CompetitorHistoryDto> =>
  api.get(`${ME}/history`)

export const deleteOwnAccount = (): Promise<void> => api.delete(ME)

/**
 * Every gym in the directory, for the academy picker to search. The directory
 * has no name search, and is small enough to filter in the browser.
 */
export async function getAllDirectoryGyms(): Promise<GymDto[]> {
  const gyms: GymDto[] = []
  for (let page = 1; page <= MAX_GYM_PAGES; page += 1) {
    const response = await getGyms({ page, pageSize: GYM_PAGE_SIZE })
    gyms.push(...response.data)
    if (!response.pagination.hasNextPage) {
      break
    }
  }
  return gyms
}
