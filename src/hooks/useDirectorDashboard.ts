"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ScheduleEvent } from '@/components/SimpleCalendar'

type Role = 'director' | 'club' | 'faculty'

export interface DirectorUser {
  role: Role
  email: string
}

export interface DirectorClubEvent {
  id: string
  title: string
  date?: string
  description?: string
  status?: string
  color?: string
  clubName?: string
  clubId?: string
}

export interface DirectorClub {
  id: string
  name: string
  head: string
  description: string
  email?: string
  approved: boolean
  color: string
  contact_links?: string[]
  membersCount?: number
  eventsCount?: number
  events: DirectorClubEvent[]
}

export interface DirectorBudgetRequest {
  id: string
  clubId?: string
  event_name: string
  organisers: string
  expected_budget: number
  final_budget?: number
  tentative_month: string
  status: string
  createdAt?: string | null
}

export interface DirectorNotification {
  type: 'club-approval' | 'event-approval' | 'budget-request'
  message: string
  timestamp?: string | null
}

export interface DirectorStats {
  totalClubs: number
  remainingBudget: number
  totalBudget?: number
  usedBudget?: number
  scheduledEvents: number
  pendingApprovals: number
}

interface DirectorDashboardResponse {
  clubs?: DirectorClub[]
  pendingClubs?: DirectorClub[]
  budgetRequests?: DirectorBudgetRequest[]
  budgetRequestsAll?: DirectorBudgetRequest[]
  calendarEvents?: DirectorClubEvent[]
  notifications?: DirectorNotification[]
  stats?: DirectorStats
}

interface DirectorDashboardState {
  clubs: DirectorClub[]
  pendingClubs: DirectorClub[]
  budgetRequests: DirectorBudgetRequest[]
  budgetRequestsAll: DirectorBudgetRequest[]
  calendarEvents: ScheduleEvent[]
  pendingEvents: ScheduleEvent[]
  notifications: DirectorNotification[]
  stats: DirectorStats
}

const defaultStats: DirectorStats = {
  totalClubs: 0,
  remainingBudget: 1000000,
  totalBudget: 1000000,
  usedBudget: 0,
  scheduledEvents: 0,
  pendingApprovals: 0
}

const emptyState: DirectorDashboardState = {
  clubs: [],
  pendingClubs: [],
  budgetRequests: [],
  budgetRequestsAll: [],
  calendarEvents: [],
  pendingEvents: [],
  notifications: [],
  stats: defaultStats
}

export function useDirectorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<DirectorUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [data, setData] = useState<DirectorDashboardState>(emptyState)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const decodeUser = useCallback((jwtToken: string) => {
    try {
      const payload = JSON.parse(atob(jwtToken.split('.')[1]))
      if (!payload || payload.role !== 'director') {
        router.push('/')
        return null
      }
      return { role: payload.role as Role, email: payload.email } satisfies DirectorUser
    } catch (err) {
      console.error('Failed to decode token payload', err)
      router.push('/')
      return null
    }
  }, [router])

  const mapEvents = useCallback((events: DirectorClubEvent[] | undefined): ScheduleEvent[] => {
    if (!events) return []

    return events.map((event) => {
      const start = new Date(event.date ?? (event as any).start ?? new Date())
      const endSource = (event as any).end
      const end = endSource ? new Date(endSource) : new Date(start.getTime() + 60 * 60 * 1000)

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        color: event.color || '#ffffff',
        description: event.description,
        status: event.status,
        clubName: event.clubName,
        clubId: event.clubId
      }
    })
  }, [])

  const fetchData = useCallback(async (authToken: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/director', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Dashboard request failed with status ${response.status}`)
      }

      const payload: DirectorDashboardResponse = await response.json()
      const mappedEvents = mapEvents(payload.calendarEvents)
        const safeClubs = (payload.clubs || []).map((club) => ({
          ...club,
          events: club.events || []
        }))
        const safePendingClubs = (payload.pendingClubs || []).map((club) => ({
          ...club,
          events: club.events || []
        }))

      setData({
          clubs: safeClubs,
          pendingClubs: safePendingClubs,
        budgetRequests: payload.budgetRequests || [],
        budgetRequestsAll: payload.budgetRequestsAll || [],
        calendarEvents: mappedEvents,
        pendingEvents: mappedEvents.filter((event) => event.status === 'pending' || event.status === 'waiting'),
        notifications: payload.notifications || [],
        stats: payload.stats || defaultStats
      })
    } catch (err) {
      console.error('Failed to load director dashboard data', err)
      setData(emptyState)
      setError(err instanceof Error ? err.message : 'Unable to load data')
    } finally {
      setIsLoading(false)
    }
  }, [mapEvents])

  useEffect(() => {
  const storedToken = localStorage.getItem('director_token')
    if (!storedToken) {
      router.push('/')
      return
    }

    setToken(storedToken)
    const decoded = decodeUser(storedToken)
    if (decoded) {
      setUser(decoded)
      fetchData(storedToken)
    }
  }, [decodeUser, fetchData, router])

  const refresh = useCallback(async () => {
    if (!token) return
    await fetchData(token)
  }, [fetchData, token])

  const logout = useCallback(() => {
  localStorage.removeItem('director_token')
    setToken(null)
    setUser(null)
    setData(emptyState)
    router.push('/')
  }, [router])

  const approveClub = useCallback(async (club: Pick<DirectorClub, 'id' | 'email'>) => {
    if (!token) return false

    try {
      const response = await fetch('/api/director/approve-club', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ clubId: club.id, clubEmail: club.email })
      })

      if (!response.ok) {
        console.error('Approve club failed', await response.text())
        return false
      }

      await fetchData(token)
      return true
    } catch (err) {
      console.error('Approve club error', err)
      return false
    }
  }, [fetchData, token])

  const rejectClub = useCallback(async (club: Pick<DirectorClub, 'id' | 'email'>) => {
    if (!token) return false

    try {
      const response = await fetch('/api/director/reject-club', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ clubId: club.id, clubEmail: club.email })
      })

      if (!response.ok) {
        console.error('Reject club failed', await response.text())
        return false
      }

      await fetchData(token)
      return true
    } catch (err) {
      console.error('Reject club error', err)
      return false
    }
  }, [fetchData, token])

  const updateEventStatus = useCallback(async (event: DirectorClubEvent, status: 'approved' | 'rejected') => {
    if (!token || !event.clubId) return false

    try {
      const response = await fetch('/api/director/update-event-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clubId: event.clubId,
          eventId: event.id,
          status
        })
      })

      if (!response.ok) {
        console.error('Update event status failed', await response.text())
        return false
      }

      await fetchData(token)
      return true
    } catch (err) {
      console.error('Update event status error', err)
      return false
    }
  }, [fetchData, token])

  const updateBudgetRequest = useCallback(async (
    requestId: string,
    action: 'approve' | 'reject' | 'counter',
    finalBudget?: number
  ) => {
    if (!token) return false

    try {
      const response = await fetch('/api/director/update-budget-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, action, finalBudget })
      })

      if (!response.ok) {
        console.error('Update budget request failed', await response.text())
        return false
      }

      await fetchData(token)
      return true
    } catch (err) {
      console.error('Update budget request error', err)
      return false
    }
  }, [fetchData, token])

  const hasData = useMemo(() => data.clubs.length > 0 || data.pendingClubs.length > 0, [data.clubs.length, data.pendingClubs.length])

  return {
    user,
    token,
    data,
    isLoading,
    error,
    hasData,
    refresh,
    logout,
    approveClub,
    rejectClub,
    updateEventStatus
    , updateBudgetRequest
  }
}
