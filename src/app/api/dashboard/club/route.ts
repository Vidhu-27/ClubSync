import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
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

    if (decoded.role !== 'club') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const clubIdRaw = decoded.clubId

    // Get club data (support both real Mongo ObjectId and mock/string ids)
    let club = null as any
    if (typeof clubIdRaw === 'string' && ObjectId.isValid(clubIdRaw)) {
      try {
        const clubObjectId = new ObjectId(clubIdRaw)
        club = await db.collection('clubs').findOne({ _id: clubObjectId })
      } catch {
        // fall through to string-based lookups
      }
    }
    if (!club) {
      // Try string _id (mock) match
      club = await db.collection('clubs').findOne({ _id: clubIdRaw })
    }
    if (!club) {
      // Try separate id field (some mock docs store both id and _id)
      club = await db.collection('clubs').findOne({ id: clubIdRaw })
    }
    if (!club && decoded.email) {
      // Fallback by email
      club = await db.collection('clubs').findOne({ email: String(decoded.email).toLowerCase() })
    }
    if (!club) {
      return NextResponse.json({ message: 'Club not found' }, { status: 404 })
    }

    // Get budget stats for this club
    type BudgetReq = { status: string; final_budget?: number; expected_budget?: number }
    const budgetRequests = await db.collection('budget_requests').find({ 
      club_id: clubIdRaw 
    }).toArray() as BudgetReq[]

    const budgetStats = {
      approved_count: budgetRequests.filter((req: BudgetReq) => req.status === 'approved').length,
      pending_count: budgetRequests.filter((req: BudgetReq) => req.status === 'pending').length,
      rejected_count: budgetRequests.filter((req: BudgetReq) => req.status === 'rejected').length,
      approved_total: budgetRequests
        .filter((req: BudgetReq) => req.status === 'approved')
        .reduce((sum: number, req: BudgetReq) => sum + (req.final_budget || 0), 0),
      pending_total: budgetRequests
        .filter((req: BudgetReq) => req.status === 'pending')
        .reduce((sum: number, req: BudgetReq) => sum + (req.expected_budget || 0), 0),
      rejected_total: budgetRequests
        .filter((req: BudgetReq) => req.status === 'rejected')
        .reduce((sum: number, req: BudgetReq) => sum + (req.expected_budget || 0), 0)
    }

    return NextResponse.json({
      club: {
        id: club._id.toString(),
        name: club.name,
        head: club.head,
        description: club.description,
        email: club.email,
        approved: club.approved,
        color: club.color,
        contact_links: club.contact_links || [],
        createdAt: club.createdAt ? new Date(club.createdAt).toISOString() : null,
        approvedAt: club.approvedAt ? new Date(club.approvedAt).toISOString() : null,
        members: (club.members || []).map((member: any) => ({
          name: member.name,
          designation: member.designation,
          addedAt: member.addedAt ? new Date(member.addedAt).toISOString() : null
        })),
        events: (club.events || []).map((event: any, index: number) => ({
          id: `${club._id.toString()}-${index}`,
          title: event.title,
          date: event.date,
          description: event.description,
          status: event.status,
          createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
          color: club.color || '#ffffff'
        }))
      },
      budgetStats
    })

  } catch (error) {
    console.error('Club dashboard error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


