import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, resetMockDatabase } from '@/lib/database'

export async function POST(_request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
    const { client, db } = await connectToDatabase()

    // If no real client, we are in mock mode. Reset mock and exit.
    if (!client) {
      const state = resetMockDatabase()
      return NextResponse.json({ mode: 'mock', reset: true, state })
    }

    // Real MongoDB mode: wipe and seed defaults
    const collections = ['clubs', 'users', 'budget_requests', 'events'] as const

    await Promise.all(
      collections.map(async (name) => {
        try {
          await db.collection(name).deleteMany({})
        } catch {
          // ignore if collection does not exist yet
        }
      })
    )

    // Seed stock club (pending)
    await db.collection('clubs').insertOne({
      name: 'Arts Club',
      head: 'Jane Smith',
      description: 'Creative arts and culture',
      email: 'arts@mitwpu.edu.in',
      approved: false,
      color: null,
      contact_links: [],
      createdAt: new Date().toISOString(),
      approvedAt: null,
      members: [],
      events: []
    })

    return NextResponse.json({ mode: 'mongo', reset: true })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({ reset: false, error: 'Failed to reset' }, { status: 500 })
  }
}
