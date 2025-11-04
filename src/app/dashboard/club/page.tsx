'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SimpleCalendar, { type ScheduleEvent } from '@/components/SimpleCalendar'
import {
  Users,
  Calendar,
  DollarSign,
  Edit3
} from 'lucide-react'
import { formatInr } from '@/lib/currency'
import Modal from '@/components/Modal'

interface User {
  role: string
  email: string
  clubId: string
}

interface Club {
  id: string
  name: string
  head: string
  description: string
  color: string
  members: Member[]
  events: Event[]
}

interface Member {
  name: string
  designation: string
}

interface Event {
  title: string
  date: string
  status: string
}

interface BudgetStats {
  approved_count: number
  pending_count: number
  rejected_count: number
  approved_total: number
  pending_total: number
  rejected_total: number
}

export default function ClubDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [club, setClub] = useState<Club | null>(null)
  const [budgetStats, setBudgetStats] = useState<BudgetStats>({
    approved_count: 0,
    pending_count: 0,
    rejected_count: 0,
    approved_total: 0,
    pending_total: 0,
    rejected_total: 0
  })
  const [calendarEvents, setCalendarEvents] = useState<ScheduleEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)

  // Budget form state
  const [budgetForm, setBudgetForm] = useState({
    event_name: '',
    organisers: '',
    expected_budget: '',
    tentative_month: ''
  })

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    start: '',
    end: '',
    description: ''
  })
  const router = useRouter()

  useEffect(() => {
    // Check authentication
  const token = localStorage.getItem('club_token')
    if (!token) {
      router.push('/')
      return
    }

    // Decode token to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({
        role: payload.role,
        email: payload.email,
        clubId: payload.clubId
      })
    } catch (error) {
      router.push('/')
      return
    }

    if (token) {
      fetchClubData(token)
    }
  }, [router])

  const fetchClubData = async (token: string) => {
    try {
      const response = await fetch('/api/dashboard/club', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setClub(data.club)
        setBudgetStats(data.budgetStats || budgetStats)
        setCalendarEvents(
          (data.club?.events || []).map((event: any) => {
            const startDate = new Date(event.date)
            const endDate = event.date && event.date.includes('T')
              ? new Date(event.date)
              : new Date(startDate.getTime() + 60 * 60 * 1000)

            return {
              id: event.id,
              title: event.title,
              start: startDate,
              end: endDate,
              color: data.club?.color || '#ffffff',
              description: event.description,
              status: event.status
            }
          })
        )
      }
    } catch (error) {
      console.error('Error fetching club data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
  localStorage.removeItem('club_token')
    router.push('/')
  }

  const submitBudgetRequest = async () => {
  const token = localStorage.getItem('club_token')
    if (!token) return
    try {
      const res = await fetch('/api/club/budget-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...budgetForm,
          expected_budget: Number(budgetForm.expected_budget)
        })
      })
      if (!res.ok) throw new Error('Failed to submit request')
      setShowBudgetModal(false)
      await fetchClubData(token)
    } catch (e) {
      console.error(e)
    }
  }

  const submitEventRequest = async () => {
  const token = localStorage.getItem('club_token')
    if (!token) return
    try {
      const res = await fetch('/api/club/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      })
      if (!res.ok) throw new Error('Failed to submit event')
      setShowEventModal(false)
      await fetchClubData(token)
    } catch (e) {
      console.error(e)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !club) return null

  return (
    <>
    <div className="min-h-screen bg-black">
      <Sidebar user={{...user, clubName: club.name}} onLogout={handleLogout} />
      
      <div className="lg:ml-64">
        <div className="p-6 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{club.name}</h1>
              <p className="text-muted">Manage members, events, and budgets for your club.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Update club info
              </button>
              <button className="btn-primary" onClick={() => setShowEventModal(true)}>Create event</button>
              <button className="btn-primary" onClick={() => setShowBudgetModal(true)}>Request budget</button>
            </div>
          </div>

          <div className="card p-6 flex flex-col md:flex-row gap-6 items-start">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-xl font-semibold"
              style={{ backgroundColor: club.color || '#1f1f1f', color: '#000' }}
            >
              {club.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted">Head of club</p>
              <p className="text-lg font-medium">{club.head}</p>
              <p className="text-sm text-muted max-w-2xl leading-relaxed">{club.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="text-sm text-muted">Members</p>
              <p className="text-2xl font-semibold">{club.members.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted">Events</p>
              <p className="text-2xl font-semibold">{club.events.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted">Approved budget</p>
              <p className="text-2xl font-semibold">{formatInr(budgetStats.approved_total)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card p-6 xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Club calendar</h2>
                <a href="/dashboard/club/events" className="text-sm underline">Manage events</a>
              </div>
              <SimpleCalendar events={calendarEvents} highlight="club" />
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" /> Core members
                  </h2>
                  <a href="/dashboard/club/members" className="text-xs underline">Manage</a>
                </div>
                <div className="space-y-3">
                  {club.members.length === 0 && (
                    <p className="text-muted text-sm">Add your first member to get started.</p>
                  )}
                  {club.members.slice(0, 5).map((member, index) => (
                    <div key={index} className="border border-neutral-800 rounded-lg p-3">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted">{member.designation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5" /> Budget snapshot
                  </h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted">Approved requests</p>
                    <p className="text-lg font-semibold">{budgetStats.approved_count}</p>
                    <p className="text-sm text-muted">{formatInr(budgetStats.approved_total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Pending requests</p>
                    <p className="text-lg font-semibold">{budgetStats.pending_count}</p>
                    <p className="text-sm text-muted">{formatInr(budgetStats.pending_total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Rejected requests</p>
                    <p className="text-lg font-semibold">{budgetStats.rejected_count}</p>
                    <p className="text-sm text-muted">{formatInr(budgetStats.rejected_total)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>

  {/* Budget Modal */}
    <Modal open={showBudgetModal} title="Request budget" onClose={() => setShowBudgetModal(false)}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted">Event name</label>
          <input className="input" value={budgetForm.event_name} onChange={(e) => setBudgetForm({ ...budgetForm, event_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted">Organisers</label>
          <input className="input" value={budgetForm.organisers} onChange={(e) => setBudgetForm({ ...budgetForm, organisers: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted">Expected budget</label>
          <input type="number" className="input" value={budgetForm.expected_budget} onChange={(e) => setBudgetForm({ ...budgetForm, expected_budget: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted">Tentative month</label>
          <input className="input" placeholder="e.g. November" value={budgetForm.tentative_month} onChange={(e) => setBudgetForm({ ...budgetForm, tentative_month: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={() => setShowBudgetModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitBudgetRequest}>Submit</button>
        </div>
      </div>
    </Modal>

    {/* Event Modal */}
    <Modal open={showEventModal} title="Create event" onClose={() => setShowEventModal(false)}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted">Title</label>
          <input className="input" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted">Start (ISO)</label>
          <input className="input" placeholder="2025-11-15T09:00:00Z" value={eventForm.start} onChange={(e) => setEventForm({ ...eventForm, start: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted">End (optional ISO)</label>
          <input className="input" placeholder="2025-11-15T17:00:00Z" value={eventForm.end} onChange={(e) => setEventForm({ ...eventForm, end: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted">Description</label>
          <textarea className="input" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitEventRequest}>Submit</button>
        </div>
      </div>
    </Modal>
  </>
  )
}

