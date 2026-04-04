import { useMemo } from 'react'
import { paths } from '@/config/paths'
import { useFeatureFlag } from '@/features/feature-flags'

interface NavItem {
  to: string
  label: string
  id: 'events' | 'gyms' | 'competitions' | 'about'
}

export function useNavItems(): NavItem[] {
  const eventsEnabled = useFeatureFlag('BjjEvents')
  const gymsEnabled = useFeatureFlag('Gyms')
  const competitionsEnabled = useFeatureFlag('Competitions')

  return useMemo(() => {
    const items: NavItem[] = []
    if (eventsEnabled) {
      items.push({
        to: paths.events.getHref(),
        label: paths.events.label,
        id: 'events',
      })
    }
    if (gymsEnabled) {
      items.push({
        to: paths.gyms.getHref(),
        label: paths.gyms.label,
        id: 'gyms',
      })
    }
    if (competitionsEnabled) {
      items.push({
        to: paths.competitions.getHref(),
        label: paths.competitions.label,
        id: 'competitions',
      })
    }
    items.push({
      to: paths.about.getHref(),
      label: paths.about.label,
      id: 'about',
    })
    return items
  }, [eventsEnabled, gymsEnabled, competitionsEnabled])
}
