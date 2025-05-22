import React, { memo } from 'react'
import { BjjEventDto } from '../../../../types/event'
import { EventSchedule, EventDetails, EventHeader, EventFooter } from '.'
import { EventCardTestIds } from '../../../../constants/eventDataTestIds'
import { withTestIdSuffix } from '../../../../constants/commonDataTestIds'

interface EventCardProps {
  event: BjjEventDto
  'data-testid'?: string
}

export const EventCard: React.FC<EventCardProps> = memo(
  ({ event, 'data-testid': dataTestId }) => {
    const { name, eventUrl, schedule, type } = event

    const uniqueInstanceSuffix =
      event.id || name.replace(/\s+/g, '-').toLowerCase()
    const rootTestId =
      dataTestId ||
      withTestIdSuffix(EventCardTestIds.ROOT, uniqueInstanceSuffix)

    return (
      <article
        data-testid={rootTestId}
        className="
          flex h-full flex-col rounded-lg
          bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-800
          shadow-lg transition-all duration-300 ease-in-out
          hover:shadow-emerald-200/50 dark:hover:shadow-emerald-700/30 hover:-translate-y-1
          overflow-hidden group"
      >
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <EventHeader
            name={name}
            type={type}
            data-testid={withTestIdSuffix(
              EventCardTestIds.HEADER.ROOT,
              uniqueInstanceSuffix
            )}
            testIdInstanceSuffix={uniqueInstanceSuffix}
          />

          {/* Event Details Section */}
          <div className="mb-4">
            <EventDetails
              event={event}
              data-testid={withTestIdSuffix(
                EventCardTestIds.DETAILS.ROOT,
                uniqueInstanceSuffix
              )}
              testIdInstanceSuffix={uniqueInstanceSuffix}
            />
          </div>

          {/* Event Schedule Section */}
          {schedule && (
            <div
              className="mb-4 text-sm text-slate-600 dark:text-slate-300"
              data-testid={withTestIdSuffix(
                EventCardTestIds.SCHEDULE.ROOT,
                uniqueInstanceSuffix
              )}
            >
              <EventSchedule
                schedule={schedule}
                data-testid={withTestIdSuffix(
                  EventCardTestIds.SCHEDULE.CONTENT,
                  uniqueInstanceSuffix
                )}
                // If EventSchedule has internal parts needing specific IDs:
                //testIdInstanceSuffix={uniqueInstanceSuffix}
              />
            </div>
          )}

          {/* Spacer to push footer down */}
          <div className="flex-grow" />

          {/* Event Footer Section */}
          <EventFooter
            eventUrl={eventUrl}
            eventName={name}
            data-testid={withTestIdSuffix(
              EventCardTestIds.FOOTER.ROOT,
              uniqueInstanceSuffix
            )}
            testIdInstanceSuffix={uniqueInstanceSuffix}
          />
        </div>
      </article>
    )
  }
)
