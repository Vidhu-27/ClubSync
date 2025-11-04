import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

type Action = 'approve' | 'reject' | 'counter'

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

    const { requestId, action, finalBudget } = await request.json() as { requestId?: string; action?: Action; finalBudget?: number }

    if (!requestId || !action) {
      return NextResponse.json({ message: 'requestId and action are required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const filterCandidates: any[] = []
    if (ObjectId.isValid(requestId)) {
      filterCandidates.push({ _id: new ObjectId(requestId) })
    }
    filterCandidates.push({ _id: requestId })
    filterCandidates.push({ id: requestId })

    let update: any = {}
    if (action === 'approve') {
      update = { $set: { status: 'approved', final_budget: Number(finalBudget ?? 0) || undefined } }
    } else if (action === 'reject') {
      update = { $set: { status: 'rejected' } }
    } else if (action === 'counter') {
      if (typeof finalBudget !== 'number' || isNaN(finalBudget)) {
        return NextResponse.json({ message: 'finalBudget is required for counter' }, { status: 400 })
      }
      update = { $set: { status: 'countered', final_budget: Number(finalBudget) } }
    }

    let result: any = null
    for (const f of filterCandidates) {
      result = await db.collection('budget_requests').updateOne(f, update)
      if (result && result.matchedCount > 0) break
    }

    const isMock = process.env.NODE_ENV === 'development' || !process.env.MONGODB_URI
    if (!result || result.matchedCount === 0) {
      if (!isMock) {
        return NextResponse.json({ message: 'Budget request not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update budget request error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
