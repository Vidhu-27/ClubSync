import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { promises as fs } from 'fs'
import path from 'path'
import { ObjectId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper to ensure directory exists
async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (_) {
    // ignore
  }
}

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
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
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
    const buffer = Buffer.from(await file.arrayBuffer())
    const originalName = sanitizeFileName((file as any).name || 'report')
    const timeSuffix = Date.now()
    const ext = path.extname(originalName) || '.bin'
    const base = path.basename(originalName, ext)
    const filename = `${base}-${timeSuffix}${ext}`

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(canonicalId))
    await ensureDir(uploadDir)
    const destPath = path.join(uploadDir, filename)
    await fs.writeFile(destPath, buffer)

    const url = `/uploads/${encodeURIComponent(String(canonicalId))}/${encodeURIComponent(filename)}`
    await db.collection('reports').insertOne({
      club_id: canonicalId,
      title: title || base,
      original_name: (file as any).name || originalName,
      mime: (file as any).type,
      size: buffer.length,
      filename,
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

    // Delete file from disk (best-effort)
    try {
      if (report.filename) {
        const filePath = path.join(process.cwd(), 'public', 'uploads', String(report.club_id), report.filename)
        await fs.unlink(filePath)
      } else if (report.url) {
        const rel = decodeURIComponent(report.url.replace(/^\/+/, ''))
        const filePath = path.join(process.cwd(), 'public', rel)
        await fs.unlink(filePath)
      }
    } catch (e) {
      console.warn('Delete file warning:', e)
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
