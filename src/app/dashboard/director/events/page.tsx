'use client'

import Sidebar from '@/components/Sidebar'
import { useDirectorDashboard } from '@/hooks/useDirectorDashboard'
import type { ScheduleEvent } from '@/components/SimpleCalendar'
import {
  CalendarCheck,
  CalendarClock,
  MapPin,
  Users,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function DirectorEventsPage() {
  const { user, data, isLoading, logout } = useDirectorDashboard()
  const events = data.calendarEvents

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const upcomingEvents = events.filter((event) => event.status !== 'cancelled')
  const cancelledEvents = events.filter((event) => event.status === 'cancelled')

  const formatDateTime = (event: ScheduleEvent) => {
    const start = new Date(event.start)
    const end = new Date(event.end)
    const date = start.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
    const startTime = start.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })
    const endTime = end.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })

    return `${date} · ${startTime} – ${endTime}`
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar user={user} onLogout={logout} />

      <div className="lg:ml-64">
        <div className="p-6 space-y-8">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold">Event oversight</h1>
            <p className="text-muted">Track every upcoming club activity and quickly spot changes.</p>
          </header>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-6 w-6 text-emerald-400" />
              <div>
                <h2 className="text-xl font-semibold">Upcoming events</h2>
                <p className="text-sm text-muted">All approved events scheduled by clubs.</p>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingEvents.length === 0 && (
                <div className="border border-neutral-800 rounded-lg p-6 text-center text-sm text-muted">
                  No events on the calendar yet. Newly approved events will show up here.
                </div>
              )}

              {upcomingEvents.map((event) => (
                <article key={event.id} className="border border-neutral-800 rounded-lg bg-neutral-950/60 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      {event.clubName && (
                        <p className="text-sm text-muted">Hosted by {event.clubName}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 rounded-full text-emerald-300">
                      <CalendarClock className="h-4 w-4" />
                      {event.status === 'approved' ? 'Scheduled' : event.status}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm text-muted md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      <span>{formatDateTime(event)}</span>
                    </div>
                    {(event as ScheduleEvent & { location?: string }).location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{(event as ScheduleEvent & { location?: string }).location}</span>
                      </div>
                    )}
                    {(event as ScheduleEvent & { expectedAttendance?: number }).expectedAttendance && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Expected {(event as ScheduleEvent & { expectedAttendance?: number }).expectedAttendance} attendees</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted leading-relaxed">{event.description}</p>
                  )}

                  <div className="flex justify-end">
                    <Link
                      href={`/dashboard/director#events`}
                      className="text-xs uppercase tracking-wide flex items-center gap-1 text-primary-400 hover:text-primary-300"
                    >
                      View on dashboard
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {cancelledEvents.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-6 w-6 text-red-400" />
                <div>
                  <h2 className="text-xl font-semibold">Cancelled events</h2>
                  <p className="text-sm text-muted">Events pulled by organisers or rejected after scheduling.</p>
                </div>
              </div>

              <div className="space-y-3">
                {cancelledEvents.map((event) => (
                  <article key={event.id} className="border border-neutral-800 rounded-lg bg-neutral-950/40 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="text-base font-semibold">{event.title}</h3>
                        {event.clubName && (
                          <p className="text-xs text-muted">Hosted by {event.clubName}</p>
                        )}
                      </div>
                      <span className="text-xs uppercase tracking-wide bg-red-500/10 border border-red-500/40 px-3 py-1 rounded-full text-red-300">
                        Cancelled
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted leading-relaxed">{event.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
