import { useMemo } from 'react'
import { paths } from '@/config/paths'
import { useFeatureFlagClient } from '@/features/feature-flags'
import type { FeatureFlagName } from '@/features/feature-flags'

interface NavItem {
  to: string
  label: string
  id: 'events' | 'gyms' | 'competitions' | 'stores' | 'about'
}

const FEATURE_NAV_ITEMS = [
  { flag: 'BjjEvents', id: 'events', route: paths.events },
  { flag: 'Gyms', id: 'gyms', route: paths.gyms },
  { flag: 'Competitions', id: 'competitions', route: paths.competitions },
  { flag: 'Stores', id: 'stores', route: paths.stores },
] as const satisfies readonly {
  flag: FeatureFlagName
  id: NavItem['id']
  route: { readonly label: string; getHref: () => string }
}[]

export function useNavItems(): NavItem[] {
  const client = useFeatureFlagClient()

  return useMemo(() => {
    const items: NavItem[] = FEATURE_NAV_ITEMS.filter(item =>
      client.isEnabled(item.flag)
    ).map(item => ({
      to: item.route.getHref(),
      label: item.route.label,
      id: item.id,
    }))
    items.push({
      to: paths.about.getHref(),
      label: paths.about.label,
      id: 'about',
    })
    return items
  }, [client])
}
