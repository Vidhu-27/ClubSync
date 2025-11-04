'use client'

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

interface SimpleCalendarProps {
  events: ScheduleEvent[]
  highlight?: 'director' | 'club'
}

export default function SimpleCalendar({ events, highlight }: SimpleCalendarProps) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get events for current month
  const monthEvents = events.filter(event => {
    const eventDate = new Date(event.start)
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
  })

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {monthEvents.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">No events this month</p>
        ) : (
          monthEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900/50"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: highlight === 'director' && event.color === '#ffffff' 
                    ? '#ffffff' 
                    : event.color || '#3b82f6' 
                }}
              />
              <div className="flex-1">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted">
                  {new Date(event.start).toLocaleDateString()}
                  {event.clubName && ` • ${event.clubName}`}
                </p>
                {event.status && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.status === 'approved' ? 'bg-green-600' :
                    event.status === 'pending' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}>
                    {event.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}