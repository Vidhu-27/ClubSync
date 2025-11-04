import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { RUPEE_SYMBOL } from '@/lib/currency'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.role !== 'director') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { db } = await connectToDatabase()

    const [approvedClubs, pendingClubsRaw, budgetRequestsRaw, allBudgetRequests] = await Promise.all([
      db.collection('clubs').find({ approved: true }).toArray(),
      db.collection('clubs').find({ approved: false }).toArray(),
      db.collection('budget_requests').find({ status: 'pending' }).toArray(),
      db.collection('budget_requests').find({}).toArray()
    ])

    console.log('📊 Dashboard Data:', {
      approvedClubs: approvedClubs.length,
      pendingClubs: pendingClubsRaw.length,
      allClubs: approvedClubs.length + pendingClubsRaw.length
    })

    const serializeClub = (club: any) => ({
      id: club._id.toString(),
      name: club.name,
      head: club.head,
      description: club.description,
      email: club.email,
      approved: club.approved,
      color: club.color || '#ffffff',
      contact_links: club.contact_links || [],
      createdAt: club.createdAt ? new Date(club.createdAt).toISOString() : null,
      approvedAt: club.approvedAt ? new Date(club.approvedAt).toISOString() : null,
      membersCount: (club.members || []).length,
      eventsCount: (club.events || []).length,
      events: (club.events || []).map((event: any, index: number) => ({
        id: `${club._id.toString()}-${index}`,
        title: event.title,
        date: event.date,
        description: event.description,
        status: event.status,
        createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
        color: club.color || '#ffffff'
      }))
    })

    type SerializedClub = ReturnType<typeof serializeClub>

    const clubs: SerializedClub[] = approvedClubs.map(serializeClub)
    const pendingClubs: SerializedClub[] = pendingClubsRaw.map(serializeClub)

    interface SerializedBudgetRequest {
      id: string
      clubId: any
      event_name: string
      organisers: string
      expected_budget: number
      final_budget?: number
      tentative_month: string
      status: string
      createdAt: string | null
    }

    const budgetRequests: SerializedBudgetRequest[] = budgetRequestsRaw.map((request: any) => ({
      id: request._id instanceof ObjectId ? request._id.toString() : request._id,
      clubId: request.club_id,
      event_name: request.event_name,
      organisers: request.organisers,
      expected_budget: request.expected_budget,
      final_budget: request.final_budget,
      tentative_month: request.tentative_month,
      status: request.status,
      createdAt: request.createdAt ? new Date(request.createdAt).toISOString() : null
    }))

    // Also provide the full list so pages that need historical/approved data can render properly
    const budgetRequestsAll: SerializedBudgetRequest[] = allBudgetRequests.map((request: any) => ({
      id: request._id instanceof ObjectId ? request._id.toString() : request._id,
      clubId: request.club_id,
      event_name: request.event_name,
      organisers: request.organisers,
      expected_budget: request.expected_budget,
      final_budget: request.final_budget,
      tentative_month: request.tentative_month,
      status: request.status,
      createdAt: request.createdAt ? new Date(request.createdAt).toISOString() : null
    }))

  // Director's annual total budget
  const totalBudget = 1_000_000
    const usedBudget = allBudgetRequests
      .filter((req: any) => req.status === 'approved' || req.status === 'countered')
      .reduce((sum: number, req: any) => sum + (Number(req.final_budget || req.expected_budget || 0)), 0)

    // Remaining budget reduces as approvals/counters happen
    const remainingBudget = Math.max(0, totalBudget - usedBudget)

    type SerializedEvent = SerializedClub['events'][number]

    const approvedEvents = clubs.flatMap((club: SerializedClub) =>
      (club.events || []).filter((event: SerializedEvent) => event.status === 'approved')
    )

    const pendingEvents = clubs.flatMap((club: SerializedClub) =>
      (club.events || []).filter((event: SerializedEvent) => event.status === 'pending' || event.status === 'waiting')
    )

    const stats = {
      totalClubs: clubs.length,
      remainingBudget,
      totalBudget,
      usedBudget,
      scheduledEvents: approvedEvents.length,
      pendingApprovals: pendingClubs.length + budgetRequests.length + pendingEvents.length
    }

    type CalendarEvent = SerializedEvent & { clubId: string; clubName: string }

    const calendarEvents: CalendarEvent[] = clubs.flatMap((club: SerializedClub) =>
      (club.events || []).map((event: SerializedEvent) => ({
        ...event,
        clubId: club.id,
        clubName: club.name,
        color: event.color || club.color || '#ffffff'
      }))
    )

    const notifications = [
      ...pendingClubs.map((club: SerializedClub) => ({
        type: 'club-approval' as const,
        message: `${club.name} is waiting for approval`,
        timestamp: club.createdAt
      })),
      ...pendingEvents.map((event: SerializedEvent) => ({
        type: 'event-approval' as const,
        message: `${event.title} from ${calendarEvents.find((cal: CalendarEvent) => cal.id === event.id)?.clubName || 'a club'} is pending approval`,
        timestamp: event.createdAt
      })),
      ...budgetRequests.map((request: SerializedBudgetRequest) => ({
        type: 'budget-request' as const,
        message: `${request.event_name} submitted a budget request of ${RUPEE_SYMBOL}${request.expected_budget.toLocaleString()}`,
        timestamp: request.createdAt
      }))
    ].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return dateB - dateA
    })

    return NextResponse.json({
      clubs,
      pendingClubs,
      budgetRequests,
      budgetRequestsAll,
      calendarEvents,
      notifications,
      stats
    })

  } catch (error) {
    console.error('Director dashboard error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}