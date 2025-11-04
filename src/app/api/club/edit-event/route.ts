import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
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

    const { originalTitle, originalDate, title, date, description } = await request.json()
    if (!originalTitle || !originalDate || !title || !date) {
      return NextResponse.json({ message: 'All required fields must be provided' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get the club and find the event to update
    const club = await db.collection('clubs').findOne({ _id: new ObjectId(decoded.clubId) })
    if (!club) {
      return NextResponse.json({ message: 'Club not found' }, { status: 404 })
    }

    const events: any[] = club.events || []
    const eventIndex = events.findIndex((event: any) => 
      event.title === originalTitle && event.date === originalDate
    )

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    // Update the event
    events[eventIndex] = {
      ...events[eventIndex],
      title: title.trim(),
      date,
      description: description?.trim() || '',
      status: 'pending',
      updatedAt: new Date()
    }

    // Save the updated events array
    await db.collection('clubs').updateOne(
      { _id: new ObjectId(decoded.clubId) },
      { $set: { events } }
    )

    return NextResponse.json({
      message: 'Event updated successfully',
      success: true
    })

  } catch (error) {
    console.error('Edit event error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



