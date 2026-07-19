import { GymStatus, ClassCategory } from '@/types/gyms'
import { uiContent } from '@/config/ui-content'

const { statusLabels, classCategoryLabels } = uiContent.gyms

// Partial: statuses added server-side must fall back gracefully at runtime
const gymStatusLabels: Partial<Record<GymStatus, string>> = {
  [GymStatus.Active]: statusLabels.active,
  [GymStatus.PendingApproval]: statusLabels.pendingApproval,
  [GymStatus.TemporarilyClosed]: statusLabels.temporarilyClosed,
  [GymStatus.PermanentlyClosed]: statusLabels.permanentlyClosed,
  [GymStatus.OpeningSoon]: statusLabels.openingSoon,
  [GymStatus.Draft]: statusLabels.draft,
  [GymStatus.Rejected]: statusLabels.rejected,
}

export function getGymStatusLabel(status: GymStatus): string {
  return gymStatusLabels[status] ?? statusLabels.unknown
}

export function getGymStatusColorScheme(
  status: GymStatus
): 'emerald' | 'amber' | 'red' | 'slate' | 'blue' {
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

// Partial: categories added server-side must fall back gracefully at runtime
const classCategoryLabelMap: Partial<Record<ClassCategory, string>> = {
  [ClassCategory.Uncategorized]: classCategoryLabels.uncategorized,
  [ClassCategory.BJJGiAllLevels]: classCategoryLabels.bjjGiAllLevels,
  [ClassCategory.BJJNoGiAllLevels]: classCategoryLabels.bjjNoGiAllLevels,
  [ClassCategory.WomensOnly]: classCategoryLabels.womensOnly,
  [ClassCategory.Wrestling]: classCategoryLabels.wrestling,
  [ClassCategory.MuayThai]: classCategoryLabels.muayThai,
  [ClassCategory.Boxing]: classCategoryLabels.boxing,
  [ClassCategory.StrengthTraining]: classCategoryLabels.strengthTraining,
  [ClassCategory.YogaOrPilates]: classCategoryLabels.yogaOrPilates,
  [ClassCategory.KidsBJJ]: classCategoryLabels.kidsBjj,
  [ClassCategory.BJJGiFundamentals]: classCategoryLabels.bjjGiFundamentals,
  [ClassCategory.BJJGiAdvanced]: classCategoryLabels.bjjGiAdvanced,
  [ClassCategory.BJJNoGiFundamentals]: classCategoryLabels.bjjNoGiFundamentals,
  [ClassCategory.BJJNoGiAdvanced]: classCategoryLabels.bjjNoGiAdvanced,
  [ClassCategory.CompetitionTraining]: classCategoryLabels.competitionTraining,
  [ClassCategory.ProTraining]: classCategoryLabels.proTraining,
  [ClassCategory.Other]: classCategoryLabels.other,
}

export function getClassCategoryLabel(category: ClassCategory): string {
  return classCategoryLabelMap[category] ?? category.toString()
}
