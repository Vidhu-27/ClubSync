import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

type EventStatus = 'approved' | 'rejected'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.role !== 'director') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { clubId, eventId, status, note } = await request.json()

    if (!clubId || !eventId || !status) {
      return NextResponse.json({ message: 'clubId, eventId and status are required' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const club = await db.collection('clubs').findOne({ _id: new ObjectId(clubId) })

    if (!club) {
      return NextResponse.json({ message: 'Club not found' }, { status: 404 })
    }

    const events: any[] = club.events || []
    const eventIndex = events.findIndex((_: any, index: number) => `${club._id.toString()}-${index}` === eventId)

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    events[eventIndex] = {
      ...events[eventIndex],
      status: status as EventStatus,
      reviewedAt: new Date(),
      directorNote: note?.trim() || events[eventIndex].directorNote || ''
    }

    await db.collection('clubs').updateOne(
      { _id: club._id },
      { $set: { events } }
    )

    return NextResponse.json({
      message: `Event ${status} successfully`,
      success: true
    })
  } catch (error) {
    console.error('Update event status error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
