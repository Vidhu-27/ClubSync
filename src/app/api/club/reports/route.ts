import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { put, del } from '@vercel/blob'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Sanitize file names to avoid path traversal and spaces
function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
  const authToken = authHeader.substring(7)
  const decoded = jwt.verify(authToken, JWT_SECRET) as any
    if (decoded.role !== 'club') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const tokenClubId = decoded.clubId

    // Resolve canonical club id from DB (ObjectId or string or email)
    let clubDoc: any = null
    if (typeof tokenClubId === 'string' && ObjectId.isValid(tokenClubId)) {
      try { clubDoc = await db.collection('clubs').findOne({ _id: new ObjectId(tokenClubId) }) } catch {}
    }
    if (!clubDoc) {
      clubDoc = await db.collection('clubs').findOne({ _id: tokenClubId })
    }
    if (!clubDoc && decoded.email) {
      clubDoc = await db.collection('clubs').findOne({ email: String(decoded.email).toLowerCase() })
    }
    const canonicalId = clubDoc?._id?.toString?.() ?? String(tokenClubId)

    // Include legacy records that might have been saved with tokenClubId
    const reports = await db.collection('reports').find({ $or: [
      { club_id: canonicalId },
      { club_id: tokenClubId }
    ] }).toArray()

    const serialized = reports.map((r: any) => ({
      id: r._id?.toString?.() || r._id,
      club_id: r.club_id,
      title: r.title || r.original_name,
      original_name: r.original_name,
      mime: r.mime,
      size: r.size,
      url: r.url,
      uploadedAt: r.uploadedAt || r.createdAt
    }))

    return NextResponse.json({ reports: serialized })
  } catch (error) {
    console.error('Club reports GET error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

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

    const form = await request.formData()
    const file = form.get('file') as File | null
    const title = String(form.get('title') || '')

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    // Validate type (pdf, doc, docx)
    const allowed = ['application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes((file as any).type)) {
      return NextResponse.json({ message: 'Unsupported file type' }, { status: 400 })
    }

    const tokenClubId = decoded.clubId

    // Resolve canonical club id from DB (ObjectId or string or email)
  const { db } = await connectToDatabase()
    let clubDoc: any = null
    if (typeof tokenClubId === 'string' && ObjectId.isValid(tokenClubId)) {
      try { clubDoc = await db.collection('clubs').findOne({ _id: new ObjectId(tokenClubId) }) } catch {}
    }
    if (!clubDoc) {
      clubDoc = await db.collection('clubs').findOne({ _id: tokenClubId })
    }
    if (!clubDoc && decoded.email) {
      clubDoc = await db.collection('clubs').findOne({ email: String(decoded.email).toLowerCase() })
    }
  const canonicalId = clubDoc?._id?.toString?.() ?? String(tokenClubId)
  const originalName = sanitizeFileName((file as any).name || 'report')
    const parts = originalName.split('.')
    const ext = parts.length > 1 ? `.${parts.pop()}` : ''
    const base = parts.join('.') || 'report'
    const filename = `${base}-${Date.now()}${ext || '.bin'}`

    const blobKey = `reports/${encodeURIComponent(String(canonicalId))}/${filename}`
    const blobTokenRaw = process.env.BLOB_READ_WRITE_TOKEN
    const blobToken = blobTokenRaw && blobTokenRaw.startsWith('BLOB_READ_WRITE_TOKEN=')
      ? blobTokenRaw.split('=', 2)[1].replace(/^"|"$/g, '')
      : blobTokenRaw || undefined

    if (!blobToken && process.env.VERCEL !== '1') {
      console.error('Upload blocked: BLOB_READ_WRITE_TOKEN is not set in environment for local/dev')
      return NextResponse.json({ message: 'File storage not configured (missing BLOB token)' }, { status: 500 })
    }
    const putRes = await put(blobKey, file as any, {
      access: 'public',
      contentType: (file as any).type,
      token: blobToken
    } as any)

    const url: string = (putRes as any).url
    const pathname: string | undefined = (putRes as any).pathname || (putRes as any).path

    await db.collection('reports').insertOne({
      club_id: canonicalId,
      title: title || base,
      original_name: (file as any).name || originalName,
      mime: (file as any).type,
      size: (file as any).size ?? null,
      blob_path: pathname ?? blobKey,
      url,
      uploadedAt: new Date().toISOString()
    })

    return NextResponse.json({ message: 'Uploaded', url })
  } catch (error) {
    console.error('Club reports POST error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { db } = await connectToDatabase()

    let body: any = null
    try { body = await request.json() } catch { body = null }
    const url = new URL(request.url)
    const reportId = body?.id || body?.reportId || url.searchParams.get('id')
    if (!reportId) {
      return NextResponse.json({ message: 'Report id is required' }, { status: 400 })
    }

    // Resolve canonical club id
    const tokenClubId = decoded.clubId
    let clubDoc: any = null
    if (typeof tokenClubId === 'string' && ObjectId.isValid(tokenClubId)) {
      try { clubDoc = await db.collection('clubs').findOne({ _id: new ObjectId(tokenClubId) }) } catch {}
    }
    if (!clubDoc) {
      clubDoc = await db.collection('clubs').findOne({ _id: tokenClubId })
    }
    if (!clubDoc && decoded.email) {
      clubDoc = await db.collection('clubs').findOne({ email: String(decoded.email).toLowerCase() })
    }
    const canonicalId = clubDoc?._id?.toString?.() ?? String(tokenClubId)

    // Find the report and verify ownership
    let report: any = null
    if (ObjectId.isValid(reportId)) {
      report = await db.collection('reports').findOne({ _id: new ObjectId(reportId) })
    }
    if (!report) {
      report = await db.collection('reports').findOne({ _id: reportId })
    }
    if (!report || (report.club_id !== canonicalId && report.club_id !== tokenClubId)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Delete file from Vercel Blob (best-effort)
    try {
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN
      const blobAuth = blobToken && blobToken.startsWith('BLOB_READ_WRITE_TOKEN=')
        ? blobToken.split('=', 2)[1].replace(/^\"|\"$/g, '')
        : blobToken || undefined
      if (report.blob_path) {
        await del(report.blob_path, { token: blobAuth } as any)
      } else if (report.url) {
        await del(report.url, { token: blobAuth } as any)
      }
    } catch (e) {
      console.warn('Blob delete warning:', e)
    }

    // Delete DB record
    let delRes
    if (ObjectId.isValid(reportId)) {
      delRes = await db.collection('reports').deleteOne({ _id: new ObjectId(reportId) })
    } else {
      delRes = await db.collection('reports').deleteOne({ _id: reportId })
    }

    if (!delRes || delRes.deletedCount === 0) {
      return NextResponse.json({ message: 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Club reports DELETE error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
