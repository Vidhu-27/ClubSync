import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { ObjectId, type Filter } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const colorPalette = [
  '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', 
  '#4dd0e1', '#f06292', '#a1887f', '#90a4ae'
]

export async function POST(request: NextRequest) {
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

    const { clubId, clubEmail } = await request.json()
    if (!clubId && !clubEmail) {
      return NextResponse.json({ message: 'Club identifier is required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get current approved clubs count to assign color
    const approvedClubsCount = await db.collection('clubs').countDocuments({ approved: true })
    const assignedColor = colorPalette[approvedClubsCount % colorPalette.length]

    // Approve the club
    const update = {
      $set: {
        approved: true,
        color: assignedColor,
        approvedAt: new Date()
      }
    }

    const filters: Filter<any>[] = []
    if (clubId) {
      if (ObjectId.isValid(clubId)) {
        filters.push({ _id: new ObjectId(clubId) })
      }

      // Handle documents that use string identifiers or expose a separate id field
      filters.push({ _id: clubId })
      filters.push({ id: clubId })
    }
    if (clubEmail) {
      filters.push({ email: clubEmail.toLowerCase() })
    }

    if (filters.length === 0) {
      return NextResponse.json({ message: 'Invalid club identifier' }, { status: 400 })
    }

    let result = { matchedCount: 0 }
    for (const filter of filters) {
      console.log('🔍 Trying filter:', filter)
      result = await db.collection('clubs').updateOne(filter, update)
      console.log('✅ Update result:', result)
      if (result.matchedCount > 0) {
        break
      }
    }

    if (!result || result.matchedCount === 0) {
      console.log('❌ No club matched - clubId:', clubId, 'clubEmail:', clubEmail)
      return NextResponse.json({ message: 'Club not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Club approved successfully',
      success: true
    })

  } catch (error) {
    console.error('Approve club error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


