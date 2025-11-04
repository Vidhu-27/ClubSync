import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { ObjectId, type Filter } from 'mongodb'

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

    if (decoded.role !== 'director') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { clubId, clubEmail } = await request.json()
    if (!clubId && !clubEmail) {
      return NextResponse.json({ message: 'Club identifier is required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const filters: Filter<any>[] = []
    if (clubId) {
      if (ObjectId.isValid(clubId)) {
        filters.push({ _id: new ObjectId(clubId) })
      }
      filters.push({ _id: clubId })
      filters.push({ id: clubId })
    }
    if (clubEmail) {
      filters.push({ email: clubEmail.toLowerCase() })
    }

    if (filters.length === 0) {
      return NextResponse.json({ message: 'Invalid club identifier' }, { status: 400 })
    }

    let clubRecord: any = null
    for (const filter of filters) {
      clubRecord = await db.collection('clubs').findOne(filter)
      if (clubRecord) break
    }

    let lowerCaseEmail = clubEmail ? clubEmail.toLowerCase() : undefined
    if (clubRecord?.email && !lowerCaseEmail) {
      lowerCaseEmail = clubRecord.email.toLowerCase()
    }

    let deletionResult = { deletedCount: 0 }
    for (const filter of filters) {
      deletionResult = await db.collection('clubs').deleteOne(filter)
      if (deletionResult.deletedCount > 0) break
    }

    const isMockEnvironment = process.env.NODE_ENV === 'development'
    if (!isMockEnvironment && deletionResult.deletedCount === 0) {
      return NextResponse.json({ message: 'Club not found' }, { status: 404 })
    }

    if (lowerCaseEmail) {
      await db.collection('users').deleteOne({
        email: lowerCaseEmail,
        role: 'club'
      })
    }

    return NextResponse.json({
      message: 'Club rejected and removed successfully',
      success: true
    })

  } catch (error) {
    console.error('Reject club error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


