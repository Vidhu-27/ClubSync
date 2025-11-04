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

    const { title, date, description } = await request.json()
    if (!title || !date) {
      return NextResponse.json({ message: 'Title and date are required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Add event to club
    const eventData = {
      title: title.trim(),
      date,
      description: description?.trim() || '',
      status: 'pending',
      createdAt: new Date()
    }
    
    const result = await db.collection('clubs').updateOne(
      { _id: new ObjectId(decoded.clubId) },
      { $push: { events: eventData } } as any
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Club not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Event added successfully',
      success: true
    })

  } catch (error) {
    console.error('Add event error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
