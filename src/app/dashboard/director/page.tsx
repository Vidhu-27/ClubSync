
'use client'

import Sidebar from '@/components/Sidebar'
import DirectorCalendar from '@/components/DirectorCalendar'
import { useDirectorDashboard } from '@/hooks/useDirectorDashboard'
import React from 'react'
import {
  Building2,
  DollarSign,
  Users,
  CheckCircle,
  Bell
} from 'lucide-react'
import { formatInr } from '@/lib/currency'

export default function DirectorDashboard() {
  const {
    user,
    data,
    isLoading,
    logout,
    approveClub,
    rejectClub,
    updateEventStatus,
    refresh,
    updateBudgetRequest
  } = useDirectorDashboard()
  const [counterEditId, setCounterEditId] = React.useState<string | null>(null)
  const [counterValue, setCounterValue] = React.useState<string>('')

  const { stats, calendarEvents, pendingEvents, pendingClubs, budgetRequests, notifications } = data

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black">
      <Sidebar user={user} onLogout={logout} />
      
      <div className="lg:ml-64">
        <div className="p-6 space-y-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">Director dashboard</h1>
            <p className="text-muted">Overview of every club and upcoming activity.</p>
          </div>

          <div id="stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <Building2 className="h-6 w-6 mb-3" />
              <p className="text-sm text-muted">Active clubs</p>
              <p className="text-2xl font-semibold">{stats.totalClubs}</p>
            </div>
            <div className="stat-card">
              <DollarSign className="h-6 w-6 mb-3" />
              <p className="text-sm text-muted">Budget remaining</p>
              <p className="text-2xl font-semibold">{formatInr(stats.remainingBudget)}</p>
            </div>
            <div className="stat-card">
              <Users className="h-6 w-6 mb-3" />
              <p className="text-sm text-muted">Scheduled events</p>
              <p className="text-2xl font-semibold">{stats.scheduledEvents}</p>
            </div>
            <div className="stat-card">
              <Bell className="h-6 w-6 mb-3" />
              <p className="text-sm text-muted">Items awaiting review</p>
              <p className="text-2xl font-semibold">{stats.pendingApprovals}</p>
            </div>
          </div>

          <div id="events" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="space-y-4 xl:col-span-2">
              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Calendar</h2>
                    <p className="text-muted text-sm">Every event, color-coded per club. Director events use white.</p>
                  </div>
                </div>
                <DirectorCalendar
                  events={calendarEvents}
                  onRefresh={refresh}
                  loading={isLoading}
                  showNavigation={true}
                  variant="compact"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div id="pending-events" className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Pending events</h2>
                  <span className="text-muted text-sm">{pendingEvents.length}</span>
                </div>
                <div className="space-y-3">
                  {pendingEvents.length === 0 && (
                    <p className="text-muted text-sm">No event approvals pending.</p>
                  )}
                  {pendingEvents.map((event) => (
                    <div key={event.id} className="border border-neutral-800 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-xs text-muted">{event.clubName}</p>
                        </div>
                        <p className="text-xs text-muted">
                          {event.start.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-primary text-sm" onClick={() => updateEventStatus(event, 'approved')}>
                          Approve
                        </button>
                        <button className="btn-danger text-sm" onClick={() => updateEventStatus(event, 'rejected')}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div id="clubs" className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Pending club approvals
                  </h2>
                  <span className="text-muted text-sm">{pendingClubs.length}</span>
                </div>
                <div className="space-y-3">
                  {pendingClubs.length === 0 && (
                    <p className="text-muted text-sm">No clubs waiting right now.</p>
                  )}
                  {pendingClubs.map((club) => (
                    <div key={club.id} className="border border-neutral-800 rounded-lg p-3">
                      <p className="font-medium">{club.name}</p>
                      <p className="text-xs text-muted">Head: {club.head}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          className="btn-primary text-sm"
                          onClick={() => approveClub({ id: club.id, email: club.email })}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-danger text-sm"
                          onClick={() => rejectClub({ id: club.id, email: club.email })}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div id="budget" className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5" /> Budget requests
                  </h2>
                  <span className="text-muted text-sm">{budgetRequests.length}</span>
                </div>
                <div className="space-y-3">
                  {budgetRequests.length === 0 && (
                    <p className="text-muted text-sm">No budget requests needing attention.</p>
                  )}
                  {budgetRequests.map((request) => (
                    <div key={request.id} className="border border-neutral-800 rounded-lg p-3">
                      <p className="font-medium">{request.event_name}</p>
                      <p className="text-xs text-muted">Organisers: {request.organisers}</p>
                      <p className="text-sm mt-2">Expected: {formatInr(request.expected_budget)}</p>
                      <p className="text-xs text-muted">Month: {request.tentative_month}</p>
                      <div className="flex flex-col gap-2 mt-3">
                        <div className="flex gap-2">
                          <button
                            className="btn-primary text-sm"
                            onClick={() => updateBudgetRequest(request.id, 'approve', request.final_budget ?? request.expected_budget)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-secondary text-sm"
                            onClick={() => {
                              setCounterEditId(request.id)
                              setCounterValue(String(request.final_budget ?? request.expected_budget ?? ''))
                            }}
                          >
                            Counter
                          </button>
                          <button
                            className="btn-danger text-sm"
                            onClick={() => updateBudgetRequest(request.id, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                        {counterEditId === request.id && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={counterValue}
                              onChange={(e) => setCounterValue(e.target.value)}
                              placeholder="Enter counter amount (₹)"
                              className="input-field w-full"
                            />
                            <button
                              className="btn-primary text-sm"
                              onClick={() => {
                                const value = Number(counterValue)
                                if (Number.isNaN(value) || value < 0) return
                                updateBudgetRequest(request.id, 'counter', value).then(() => {
                                  setCounterEditId(null)
                                  setCounterValue('')
                                })
                              }}
                            >
                              Save
                            </button>
                            <button
                              className="btn-secondary text-sm"
                              onClick={() => { setCounterEditId(null); setCounterValue('') }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h2 className="text-lg font-semibold mb-3">Notifications</h2>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 && (
                    <p className="text-muted text-sm">You're all caught up.</p>
                  )}
                  {notifications.map((notification, index) => (
                    <div key={`${notification.type}-${index}`} className="border border-neutral-800 rounded-lg p-3">
                      <p className="text-sm">{notification.message}</p>
                      {notification.timestamp && (
                        <p className="text-xs text-muted mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

