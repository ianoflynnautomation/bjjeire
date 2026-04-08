import { memo } from 'react'
import type { JSX } from 'react'

import type { StoreDto } from '@/types/stores'
import { Card, CardContent } from '@/components/ui/card/card'
import { CardActionButton } from '@/components/ui/button/button'
import {
  StoresPageTestIds,
  StoresCardTestIds,
} from '@/constants/storeDataTestIds'
import { GlobeAltIcon } from '@heroicons/react/20/solid'
import { uiContent } from '@/config/ui-content'
import { StoreCardHeader } from './store-card-header'

const { card } = uiContent.stores

interface StoreCardProps {
  store: StoreDto
  'data-testid'?: string
}

export const StoreCard = memo(function StoreCard({
  store,
  'data-testid': dataTestId,
}: StoreCardProps): JSX.Element {
  const { name, description, websiteUrl, logoUrl } = store

  const headingId = `competition-card-heading-${store.id ?? name.replaceAll(/\s+/gu, '-').toLowerCase()}`
  const rootTestId = dataTestId ?? StoresPageTestIds.LIST_ITEM

  return (
    <Card
      className="relative isolate focus-within:ring-2 focus-within:ring-emerald-500/60"
      data-testid={rootTestId}
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-emerald-400/40 to-transparent"
        aria-hidden="true"
      />

      <StoreCardHeader name={name} logoUrl={logoUrl} />

      <CardContent>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h3
            id={headingId}
            className="text-base font-bold leading-snug text-slate-900 dark:text-white"
            data-testid={StoresCardTestIds.NAME}
          >
            {name || card.fallbackName}
          </h3>
        </div>

        {description && (
          <p
            className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
            data-testid={StoresCardTestIds.DESCRIPTION}
          >
            {description}
          </p>
        )}
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <CardActionButton
            href={websiteUrl || undefined}
            icon={<GlobeAltIcon className="h-4 w-4" aria-hidden="true" />}
            aria-label={`${websiteUrl ? card.visitWebsiteButton : card.noWebsiteButton} for ${name}`}
            title={websiteUrl ? card.visitWebsiteButton : card.noWebsiteButton}
            data-testid={StoresCardTestIds.WEBSITE_BUTTON}
            className="flex-1"
          >
            {websiteUrl ? card.visitWebsiteButton : card.noWebsiteButton}
          </CardActionButton>
        </div>
      </CardContent>
    </Card>
  )
})
