import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.role !== 'club') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, start, end, description } = body

    if (!title || !start) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const newEvent = {
      title,
      date: start, // ISO string
      description: description || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    // Push into the club's events array
    const result = await db.collection('clubs').updateOne(
      { _id: decoded.clubId },
      { $push: { events: newEvent } }
    )

    if (!result || (result as any).matchedCount === 0) {
      // Try with id
      const fallback = await db.collection('clubs').updateOne(
        { id: decoded.clubId },
        { $push: { events: newEvent } }
      )
      if (!fallback || (fallback as any).matchedCount === 0) {
        return NextResponse.json({ message: 'Club not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ success: true, event: newEvent })
  } catch (error) {
    console.error('Club event create error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
