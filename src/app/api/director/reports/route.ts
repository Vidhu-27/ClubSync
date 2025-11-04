import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
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

    const { db } = await connectToDatabase()
    const clubsRaw = await db.collection('clubs').find({}).toArray()
    const reportsRaw = await db.collection('reports').find({}).toArray()

    const clubs = clubsRaw.map((club: any) => ({
      id: club._id?.toString?.() || club._id,
      name: club.name,
      color: club.color || '#ffffff'
    }))

    const byClub: Record<string, any[]> = {}
    for (const r of reportsRaw) {
      const clubId = r.club_id
      if (!byClub[clubId]) byClub[clubId] = []
      byClub[clubId].push({
        id: r._id?.toString?.() || r._id,
        title: r.title || r.original_name,
        original_name: r.original_name,
        mime: r.mime,
        size: r.size,
        url: r.url,
        uploadedAt: r.uploadedAt || r.createdAt
      })
    }

    return NextResponse.json({ clubs, reportsByClub: byClub })
  } catch (error) {
    console.error('Director reports GET error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
