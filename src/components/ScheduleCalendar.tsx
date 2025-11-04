'use client'

import { useMemo } from 'react'
import {
  Calendar,
  dateFnsLocalizer,
  type EventPropGetter
} from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'

import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/app/calendar.css'

const locales = {
  'en-US': enUS
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

export interface ScheduleEvent {
  id: string
  title: string
  start: Date
  end: Date
  color: string
  description?: string
  clubName?: string
  status?: string
  clubId?: string
}

interface ScheduleCalendarProps {
  events: ScheduleEvent[]
  highlight?: 'director' | 'club'
}

export default function ScheduleCalendar({ events, highlight }: ScheduleCalendarProps) {
  const calendarEvents = useMemo<ScheduleEvent[]>(() => {
    return events.map((event) => ({
      ...event,
      start: event.start,
      end: event.end
    }))
  }, [events])

  const eventStyleGetter: EventPropGetter<ScheduleEvent> = (
    event: ScheduleEvent,
    _start: Date,
    _end: Date,
    _isSelected: boolean
  ) => {
    const backgroundColor = event.color || '#ffffff'
    const textColor = highlight === 'director' && backgroundColor.toLowerCase() === '#ffffff'
      ? '#000000'
      : '#ffffff'

    return {
      style: {
        backgroundColor,
        color: textColor,
        borderRadius: '0.5rem',
        border: 'none',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
        padding: '0.25rem 0.5rem',
        fontSize: '0.85rem'
      }
    }
  }

  return (
    <div className="calendar-shell">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        popup
        views={['month', 'agenda']}
        defaultView="month"
        eventPropGetter={eventStyleGetter}
        min={new Date(1970, 0, 1, 6, 0)}
        max={new Date(1970, 0, 1, 22, 0)}
      />
    </div>
  )
}
