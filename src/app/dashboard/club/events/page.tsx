'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Calendar, Plus, Edit3, Trash2, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'

interface User {
  role: string
  email: string
  clubId: string
}

interface Club {
  id: string
  name: string
  events: Event[]
}

interface Event {
  title: string
  date: string
  status: string
  description?: string
  organisers?: string
  expected_budget?: number
}

export default function ClubEventsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [club, setClub] = useState<Club | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    description: ''
  })
  const [budgetForm, setBudgetForm] = useState({
    event_name: '',
    organisers: '',
    expected_budget: '',
    tentative_month: ''
  })
  const router = useRouter()

  useEffect(() => {
    // Check authentication
  const token = localStorage.getItem('club_token')
    if (!token) {
      router.push('/')
      return
    }

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

    fetchClubData()
  }, [router])

  const fetchClubData = async () => {
    try {
  const token = localStorage.getItem('club_token')
      const response = await fetch('/api/dashboard/club', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setClub(data.club)
      }
    } catch (error) {
      console.error('Error fetching club data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title.trim() || !newEvent.date) return

    try {
  const token = localStorage.getItem('club_token')
      const eventData = {
        title: newEvent.title.trim(),
        date: newEvent.time ? `${newEvent.date}T${newEvent.time}` : newEvent.date,
        description: newEvent.description.trim() || ''
      }

      const response = await fetch('/api/club/add-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      })

      if (response.ok) {
        setNewEvent({ title: '', date: '', time: '', description: '' })
        setShowAddForm(false)
        fetchClubData() // Refresh data
      }
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return

    try {
  const token = localStorage.getItem('club_token')
      const eventData = {
        originalTitle: editingEvent.title,
        originalDate: editingEvent.date,
        title: newEvent.title.trim(),
        date: newEvent.time ? `${newEvent.date}T${newEvent.time}` : newEvent.date,
        description: newEvent.description.trim() || ''
      }

      const response = await fetch('/api/club/edit-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      })

      if (response.ok) {
        setEditingEvent(null)
        setNewEvent({ title: '', date: '', time: '', description: '' })
        fetchClubData() // Refresh data
      }
    } catch (error) {
      console.error('Error editing event:', error)
    }
  }

  const handleDeleteEvent = async (title: string, date: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
  const token = localStorage.getItem('club_token')
      const response = await fetch('/api/club/delete-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, date })
      })

      if (response.ok) {
        fetchClubData() // Refresh data
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const startEdit = (event: Event) => {
    setEditingEvent(event)
    setNewEvent({
      title: event.title,
      date: event.date.split('T')[0] || event.date,
      time: event.date.includes('T') ? event.date.split('T')[1] : '',
      description: event.description || ''
    })
    setShowAddForm(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400'
      case 'rejected': return 'bg-red-500/20 text-red-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-neutral-800 text-neutral-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const openBudgetFormForEvent = (event?: Event) => {
    if (event) {
      // Derive month name from event date
      const d = new Date(event.date)
      const month = d.toLocaleString('en-IN', { month: 'long' })
      setBudgetForm({
        event_name: event.title,
        organisers: event.organisers || '',
        expected_budget: event.expected_budget ? String(event.expected_budget) : '',
        tentative_month: month
      })
    } else {
      setBudgetForm({ event_name: '', organisers: '', expected_budget: '', tentative_month: '' })
    }
    setShowBudgetForm(true)
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
      setShowBudgetForm(false)
      // Optionally refresh any budget snapshot if shown on this page in the future
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogout = () => {
  localStorage.removeItem('club_token')
    router.push('/')
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
        <div className="p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Club events</h1>
              <p className="text-muted">Manage meetings and submit them for director approval.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  setEditingEvent(null)
                  setNewEvent({ title: '', date: '', time: '', description: '' })
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {editingEvent ? 'Cancel edit' : showAddForm ? 'Close form' : 'Add event'}
              </button>
              <button
                onClick={() => openBudgetFormForEvent()}
                className="btn-secondary flex items-center gap-2"
                title="Request budget"
              >
                <DollarSign className="w-5 h-5" /> Request budget
              </button>
            </div>
          </div>

          {/* Add/Edit Event Form */}
          {showAddForm && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingEvent ? 'Edit event' : 'Add new event'}
              </h2>
              <form onSubmit={editingEvent ? handleEditEvent : handleAddEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-2">
                      Event title *
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      className="input-field"
                      placeholder="Enter event title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-2">
                      Time (optional)
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      className="input-field"
                      placeholder="Event description (optional)"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary">
                    {editingEvent ? 'Update event' : 'Add event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingEvent(null)
                      setNewEvent({ title: '', date: '', time: '', description: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Inline Budget Request Form */}
          {showBudgetForm && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Request budget
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-2">Event name *</label>
                    <input className="input-field" value={budgetForm.event_name} onChange={(e) => setBudgetForm({ ...budgetForm, event_name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">Organisers</label>
                    <input className="input-field" value={budgetForm.organisers} onChange={(e) => setBudgetForm({ ...budgetForm, organisers: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-2">Expected budget *</label>
                    <input type="number" className="input-field" value={budgetForm.expected_budget} onChange={(e) => setBudgetForm({ ...budgetForm, expected_budget: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">Tentative month *</label>
                    <input className="input-field" placeholder="e.g. November" value={budgetForm.tentative_month} onChange={(e) => setBudgetForm({ ...budgetForm, tentative_month: e.target.value })} required />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="btn-primary" onClick={submitBudgetRequest}>Submit request</button>
                  <button className="btn-secondary" onClick={() => setShowBudgetForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Club events ({club.events.length})
            </h2>

            {club.events.length > 0 ? (
              <div className="space-y-4 mt-4">
                {club.events.map((event, index) => (
                  <div key={index} className="border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{event.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs uppercase tracking-wide ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted">
                          {new Date(event.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {event.date.includes('T') && ` • ${new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted">{event.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(event)}
                          className="btn-secondary text-sm"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openBudgetFormForEvent(event)}
                          className="btn-primary text-sm"
                          title="Request budget for this event"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.title, event.date)}
                          className="btn-danger text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3 mt-4">
                <Calendar className="w-16 h-16 text-neutral-700 mx-auto" />
                <h3 className="text-lg font-medium">No events yet</h3>
                <p className="text-muted text-sm">Start by adding your first club event.</p>
                <button onClick={() => setShowAddForm(true)} className="btn-primary">
                  Add first event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    
  </>
  )
}



