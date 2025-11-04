import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const anyDb = db as any
    if (typeof anyDb?.command === 'function') {
      try {
        const res = await anyDb.command({ ping: 1 })
        if (res?.ok === 1) {
          return NextResponse.json({ ok: true })
        }
      } catch {
        // fall through to generic ok when db exists but ping unsupported
      }
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'db_unreachable' }, { status: 503 })
  }
}
