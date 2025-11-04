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
    const { event_name, organisers, expected_budget, tentative_month, description } = body

    if (!event_name || !expected_budget || !tentative_month) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const doc = {
      club_id: decoded.clubId,
      event_name,
      organisers: organisers || '',
      expected_budget: Number(expected_budget),
      tentative_month,
      description: description || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    const result = await db.collection('budget_requests').insertOne(doc)

    return NextResponse.json({ success: true, id: (result as any).insertedId, request: doc })
  } catch (error) {
    console.error('Budget request error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
