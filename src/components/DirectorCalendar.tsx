'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import type { ScheduleEvent } from '@/components/SimpleCalendar'
import { RefreshCw, Plus } from 'lucide-react'
import clsx from 'clsx'

type DirectorCalendarProps = {
  events: ScheduleEvent[]
  onSelectDate?: (date: Date) => void
  onSelectEvent?: (event: ScheduleEvent) => void
  onRefresh?: () => void
  onAddEvent?: () => void
  loading?: boolean
  showNavigation?: boolean
  variant?: 'default' | 'compact'
}

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  extendedProps: {
    original: ScheduleEvent
    paletteClass: string
    isDirector: boolean
  }
}

type HoveringState = {
  x: number
  y: number
  event: ScheduleEvent
  mode: 'hover' | 'click'
}

const paletteClasses = [
  'bg-pink-400/60 text-white border border-pink-200/20',
  'bg-blue-400/60 text-white border border-blue-200/20',
  'bg-green-400/60 text-white border border-green-200/20',
  'bg-yellow-400/60 text-black border border-yellow-200/40',
  'bg-purple-400/60 text-white border border-purple-200/20'
]

const hashString = (input: string) => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getPaletteClass(event: ScheduleEvent) {
  const isDirector = event.color?.toLowerCase() === '#ffffff'
  if (isDirector) {
    return 'bg-white text-black border border-white/60 font-semibold'
  }
  const key = event.clubId || event.clubName || event.title
  const index = hashString(key) % paletteClasses.length
  return paletteClasses[index]
}

function renderEventContent(arg: EventContentArg) {
  const event = arg.event.extendedProps.original as ScheduleEvent
  const paletteClass = arg.event.extendedProps.paletteClass as string
  const isDirector = arg.event.extendedProps.isDirector as boolean

  return (
    <div
      className={clsx(
        'rounded-2xl px-3 py-2 flex flex-col gap-1 transition-colors duration-150 backdrop-blur-sm',
        paletteClass,
        isDirector ? 'shadow-none' : 'text-sm'
      )}
    >
      <span className={clsx('text-sm leading-tight', isDirector ? 'font-semibold text-sm' : 'font-medium')}>
        {arg.event.title}
      </span>
      {event.clubName && !isDirector && (
        <span className="text-xs/4 opacity-80">{event.clubName}</span>
      )}
    </div>
  )
}

export default function DirectorCalendar({
  events,
  onSelectDate,
  onSelectEvent,
  onRefresh,
  onAddEvent,
  loading,
  showNavigation = true,
  variant = 'default'
}: DirectorCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null)
  const [title, setTitle] = useState('')
  const [hovering, setHovering] = useState<HoveringState | null>(null)

  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        extendedProps: {
          original: event,
          paletteClass: getPaletteClass(event),
          isDirector: event.color?.toLowerCase() === '#ffffff'
        }
      })),
    [events]
  )

  const handlePrev = () => {
    const api = calendarRef.current?.getApi()
    api?.prev()
    setTitle(api?.view?.title ?? '')
  }

  const handleNext = () => {
    const api = calendarRef.current?.getApi()
    api?.next()
    setTitle(api?.view?.title ?? '')
  }

  const handleToday = () => {
    const api = calendarRef.current?.getApi()
    api?.today()
    setTitle(api?.view?.title ?? '')
  }

  const handleDates = () => {
    const api = calendarRef.current?.getApi()
    setTitle(api?.view?.title ?? '')
  }

  useEffect(() => {
    handleDates()
  }, [])

  const handleDateClick = (info: { date: Date }) => {
    onSelectDate?.(info.date)
  }

  const handleEventClick = (info: EventClickArg) => {
    info.jsEvent.preventDefault()
    const event = info.event.extendedProps.original as ScheduleEvent
    onSelectEvent?.(event)
    setHovering({
      x: info.jsEvent.clientX,
      y: info.jsEvent.clientY,
      event,
      mode: 'click'
    })
  }

  const handleMouseEnter = (info: any) => {
    const event = info.event.extendedProps.original as ScheduleEvent
    setHovering({
      x: info.jsEvent?.clientX ?? 0,
      y: info.jsEvent?.clientY ?? 0,
      event,
      mode: 'hover'
    })
  }

  const handleMouseLeave = () => {
    setHovering((current) => (current?.mode === 'hover' ? null : current))
  }

  const clearHover = () => setHovering(null)

  return (
    <div
      className={clsx(
        'relative calendar-card',
        variant === 'compact' ? 'p-4' : 'p-6'
      )}
    >
      <div className="sticky top-0 z-20 flex items-center justify-between rounded-2xl border border-white/5 bg-black/60 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {showNavigation && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-full border border-white/10 bg-neutral-900/80 px-3 py-1 text-xs uppercase tracking-wide text-white hover:bg-neutral-800"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full border border-white/10 bg-neutral-900/80 px-3 py-1 text-xs uppercase tracking-wide text-white hover:bg-neutral-800"
              >
                Next
              </button>
            </>
          )}
        </div>
        <div className="text-lg font-semibold tracking-wide text-white">{title}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-full border border-white/10 bg-neutral-900/80 px-3 py-1 text-xs uppercase tracking-wide text-white hover:bg-neutral-800"
          >
            Today
          </button>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-full border border-white/10 bg-neutral-900/80 p-2 text-white hover:bg-neutral-800"
              aria-label="Refresh"
            >
              <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      <div
        className={clsx(
          'mt-6 rounded-3xl bg-neutral-950/60 p-4',
          variant === 'compact' ? 'p-4' : 'p-4'
        )}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          headerToolbar={false}
          height="auto"
          eventDisplay="block"
          eventContent={renderEventContent}
          viewDidMount={(arg) => {
            // Force dark backgrounds for scrollgrid containers
            const root = arg.el as HTMLElement
            const scrollgrids = root.querySelectorAll<HTMLElement>('.fc-scrollgrid, .fc-scrollgrid-sync-inner, .fc-daygrid, .fc-daygrid-body')
            scrollgrids.forEach((el) => {
              el.style.backgroundColor = '#000000'
              el.style.color = 'rgba(255, 255, 255, 0.9)'
            })
            const headers = root.querySelectorAll<HTMLElement>('.fc-col-header, .fc-col-header-cell, .fc-col-header-cell-cushion')
            headers.forEach((el) => {
              el.style.backgroundColor = '#000000'
              el.style.color = '#ffffff'
              el.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            })
          }}
          dayCellClassNames="fc-custom-day-cell"
          dayCellDidMount={(arg) => {
            // Force black background with inline styles
            // td element itself
            const cell = arg.el as HTMLElement
            cell.style.backgroundColor = '#000000';
            cell.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            const frame = arg.el.querySelector('.fc-daygrid-day-frame')
            if (frame instanceof HTMLElement) {
              frame.style.backgroundColor = '#000000'
              frame.style.color = 'rgba(255, 255, 255, 0.9)'
              frame.style.padding = '1rem 0.75rem'
              frame.style.minHeight = '6.5rem'
            }
            const dayNumber = arg.el.querySelector('.fc-daygrid-day-number')
            if (dayNumber instanceof HTMLElement) {
              dayNumber.style.color = 'rgba(255, 255, 255, 0.9)'
              dayNumber.style.fontWeight = '600'
            }
            // Today cell
            if (arg.el.classList.contains('fc-day-today')) {
              if (frame instanceof HTMLElement) {
                frame.style.backgroundColor = '#111111'
                frame.style.boxShadow = 'inset 0 0 0 1px rgba(255, 255, 255, 0.12)'
              }
              cell.style.backgroundColor = '#111111';
            }
          }}
          datesSet={handleDates}
          dateClick={(arg) => handleDateClick({ date: arg.date })}
          eventClick={handleEventClick}
          eventMouseEnter={handleMouseEnter}
          eventMouseLeave={handleMouseLeave}
          selectable
          dayMaxEventRows={variant === 'compact' ? 2 : 3}
          aspectRatio={variant === 'compact' ? 1.1 : 1.35}
          fixedWeekCount={false}
          expandRows
        />
      </div>

      {onAddEvent && (
        <button
          type="button"
          onClick={onAddEvent}
          className="group absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/80 text-white backdrop-blur-lg transition-colors duration-150 hover:bg-primary-400"
          aria-label="Add event"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {hovering && (
        <div
          className="fixed z-50 max-w-xs rounded-2xl border border-white/10 bg-neutral-950/95 p-4 text-sm shadow-none backdrop-blur-xl"
          style={{
            top: hovering.y + 12,
            left: hovering.x + 12
          }}
          onMouseLeave={() => setHovering((current) => (current?.mode === 'hover' ? null : current))}
        >
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-white">{hovering.event.title}</div>
            {hovering.event.clubName && (
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                {hovering.event.clubName}
              </div>
            )}
            {hovering.event.description && (
              <p className="text-xs text-neutral-300 leading-relaxed">
                {hovering.event.description}
              </p>
            )}
            <div className="text-xs text-neutral-400">
              {hovering.event.start.toLocaleString()} – {hovering.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      {hovering?.mode === 'click' && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default bg-transparent"
          onClick={clearHover}
          aria-label="Close event details"
        />
      )}
    </div>
  )
}
