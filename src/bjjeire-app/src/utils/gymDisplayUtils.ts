import { GymStatus, ClassCategory } from '@/types/gyms'

export const getGymStatusLabel = (status: GymStatus): string => {
  const labels: Record<GymStatus, string> = {
    [GymStatus.Active]: 'Active',
    [GymStatus.PendingApproval]: 'Pending Approval',
    [GymStatus.TemporarilyClosed]: 'Temporarily Closed',
    [GymStatus.PermanentlyClosed]: 'Permanently Closed',
    [GymStatus.OpeningSoon]: 'Opening Soon',
    [GymStatus.Draft]: 'Draft',
    [GymStatus.Rejected]: 'Rejected',
  }
  return labels[status] || 'Unknown Status'
}

export const getGymStatusColorScheme = (
  status: GymStatus
): 'emerald' | 'amber' | 'red' | 'slate' | 'blue' => {
  switch (status) {
    case GymStatus.Active:
    case GymStatus.OpeningSoon:
      return 'emerald'
    case GymStatus.PendingApproval:
    case GymStatus.Draft:
      return 'amber'
    case GymStatus.TemporarilyClosed:
      return 'blue'
    case GymStatus.PermanentlyClosed:
    case GymStatus.Rejected:
      return 'red'
    default:
      return 'slate'
  }
}


export const getClassCategoryLabel = (category: ClassCategory): string => {
  const labels: Record<ClassCategory, string> = {
    [ClassCategory.Uncategorized]: 'Uncategorized',
    [ClassCategory.BJJGiAllLevels]: 'BJJ Gi (All Levels)',
    [ClassCategory.BJJNoGiAllLevels]: 'BJJ No-Gi (All Levels)',
    [ClassCategory.WomensOnly]: "Women's Only",
    [ClassCategory.Wrestling]: 'Wrestling',
    [ClassCategory.MuayThai]: 'Muay Thai',
    [ClassCategory.Boxing]: 'Boxing',
    [ClassCategory.StrengthTraining]: 'Strength Training',
    [ClassCategory.YogaOrPilates]: 'Yoga/Pilates',
    [ClassCategory.KidsBJJ]: 'Kids BJJ',
    [ClassCategory.BJJGiFundamentals]: 'BJJ Gi (Fundamentals)',
    [ClassCategory.BJJGiAdvanced]: 'BJJ Gi (Advanced)',
    [ClassCategory.BJJNoGiFundamentals]: 'BJJ No-Gi (Fundamentals)',
    [ClassCategory.BJJNoGiAdvanced]: 'BJJ No-Gi (Advanced)',
    [ClassCategory.CompetitionTraining]: 'Competition Training',
    [ClassCategory.ProTraining]: 'Pro Training',
    [ClassCategory.Other]: 'Other',
  };
  return labels[category] || category.toString();
};