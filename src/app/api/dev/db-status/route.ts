import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, isUsingMockDb } from '@/lib/database'

export async function GET(_req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
    const { db } = await connectToDatabase()

    const usingMock = isUsingMockDb()
    const envUri = Boolean(process.env.MONGODB_URI)
    const envDb = process.env.MONGODB_DB || 'clubsync'

    // Try a cheap call only when not mock
    let ping: 'ok' | 'skipped' | 'failed' = 'skipped'
    if (!usingMock) {
      try {
        // mongodb driver Db has command; mock does not
        // @ts-ignore
        const res = await (db as any).command?.({ ping: 1 })
        if (res?.ok === 1) ping = 'ok'
      } catch {
        ping = 'failed'
      }
    }

    return NextResponse.json({
      mode: usingMock ? 'mock' : 'mongo',
      mongoUriPresent: envUri,
      dbName: envDb,
      ping,
    })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to get DB status', error: String(error) }, { status: 500 })
  }
}
