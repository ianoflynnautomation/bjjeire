import { paths } from '@/config/paths'

export const navItems = [
  {
    to: paths.events.getHref(),
    label: paths.events.label,
    id: 'events' as const,
  },
  { to: paths.gyms.getHref(), label: paths.gyms.label, id: 'gyms' as const },
  { to: paths.about.getHref(), label: paths.about.label, id: 'about' as const },
]
